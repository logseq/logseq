(ns frontend.handler.db-based.import-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.db-based.import :as import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- submit-edn-dialog!
  [dialog-content export-map button-element]
  (import-handler/import-edn-data-dialog)
  (let [[_ _ textarea button] @dialog-content]
    ((:on-change (second textarea))
     #js {:target #js {:value (pr-str export-map)}})
    ((:on-click (second button))
     #js {:currentTarget button-element})))

(deftest import-from-sqlite-db-persists-import-marker-through-worker-test
  (async done
    (let [calls (atom [])
          graph (str config/db-version-prefix "imported")]
      (p/with-redefs [persist-db/<import-db
                      (fn [repo buffer]
                        (swap! calls conj [:import-db repo buffer])
                        (p/resolved nil))
                      state/add-repo!
                      (fn [repo]
                        (swap! calls conj [:add-repo repo])
                        (p/resolved nil))
                      repo-handler/restore-and-setup-repo!
                      (fn [repo opts]
                        (swap! calls conj [:restore repo opts])
                        (p/resolved nil))
                      state/set-current-repo!
                      (fn [repo]
                        (swap! calls conj [:current-repo repo])
                        nil)
                      persist-db/<export-db
                      (fn [repo opts]
                        (swap! calls conj [:export-db repo opts])
                        (p/resolved nil))
                      state/<invoke-db-worker
                      (fn [& args]
                        (swap! calls conj (vec args))
                        (p/resolved nil))
                      db/transact!
                      (fn [& _]
                        (throw (js/Error. "renderer DB transact should not be used")))]
        (-> (import-handler/import-from-sqlite-db! "buffer" "imported" #(swap! calls conj [:finished]))
            (p/then
             (fn []
               (let [[import-call add-repo-call restore-call current-repo-call export-call worker-call finished-call] @calls
                     [api worker-repo tx-data tx-meta context] worker-call]
                 (is (= [:import-db graph "buffer"] import-call))
                 (is (= [:add-repo {:url graph}] add-repo-call))
                 (is (= [:restore graph {:import-type :sqlite-db}] restore-call))
                 (is (= [:current-repo graph] current-repo-call))
                 (is (= [:export-db graph {}] export-call))
                 (is (= :thread-api/transact api))
                 (is (= graph worker-repo))
                 (is (= :sqlite-db (-> tx-data first :kv/value)))
                 (is (= {:import-db? true} tx-meta))
                 (is (nil? context))
                 (is (= [:finished] finished-call)))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally done))))))

(deftest import-edn-data-preserves-command-editor-target-test
  (async done
    (let [dialog-content (atom nil)
          submitted-ops (atom nil)
          target-uuid (random-uuid)
          page-uuid (random-uuid)
          target-block {:block/uuid target-uuid
                        :block/page {:block/uuid page-uuid}}
          export-map {::sqlite-export/block {:block/title "Imported block"}}
          original-search-args (state/get-state :search/args)
          original-db-worker @state/*db-worker]
      (-> (p/with-redefs
            [i18n/t identity
             state/get-editor-args (constantly nil)
             shui/dialog-open! (fn [content & _]
                                 (when (vector? content)
                                   (reset! dialog-content content)))
             shui/dialog-close! (constantly nil)
             shui/textarea (fn [props] [:textarea props])
             shui/button (fn [props child] [:button props child])
             notification/show! (constantly nil)
             db-transact/apply-outliner-ops (fn [_conn ops _opts]
                                              (reset! submitted-ops ops)
                                              (p/resolved {}))]
            (state/set-state! :search/args
                              {:editor-info {:block-uuid target-uuid}})
            (reset! state/*db-worker (fn [& _] (p/resolved target-block)))
            (submit-edn-dialog! dialog-content export-map #js {:disabled false}))
          (p/then (fn []
                    (is (= target-block
                           (get-in @submitted-ops [0 1 1 :current-block])))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally (fn []
                       (reset! state/*db-worker original-db-worker)
                       (state/set-state! :search/args original-search-args)
                       (done)))))))

(deftest import-edn-data-prevents-concurrent-submission-test
  (async done
    (let [dialog-content (atom nil)
          request-count (atom 0)
          request (p/deferred)
          button-element #js {:disabled false}
          export-map {:pages-and-blocks [{:page {:block/title "Page"}}]}]
      (-> (p/with-redefs
            [i18n/t identity
             shui/dialog-open! (fn [content & _] (reset! dialog-content content))
             shui/textarea (fn [props] [:textarea props])
             shui/button (fn [props child] [:button props child])
             notification/show! (constantly nil)
             db-transact/apply-outliner-ops (fn [& _]
                                              (swap! request-count inc)
                                              request)]
            (import-handler/import-edn-data-dialog)
            (let [[_ _ textarea button] @dialog-content
                  click! (:on-click (second button))]
              ((:on-change (second textarea))
               #js {:target #js {:value (pr-str export-map)}})
              (let [result (click! #js {:currentTarget button-element})]
                (click! #js {:currentTarget button-element})
                (is (true? (.-disabled button-element)))
                (p/resolve! request {})
                result)))
          (p/then (fn []
                    (is (= 1 @request-count))
                    (is (false? (.-disabled button-element)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))
