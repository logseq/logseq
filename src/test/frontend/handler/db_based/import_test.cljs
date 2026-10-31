(ns frontend.handler.db-based.import-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.db-based.import :as import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- <submit-import-edn-form
  "Submits the Import EDN form with `edn-string` while there is no block being edited.
   Resolves to the applied outliner ops and the shown notifications"
  [edn-string]
  (let [applied-ops (atom [])
        notifications (atom [])]
    (p/let [_ (p/with-redefs [state/get-editor-args (constantly nil)
                              db-transact/apply-outliner-ops (fn [_conn ops _opts]
                                                               (swap! applied-ops into ops)
                                                               (p/resolved {}))
                              notification/show! (fn [content status & _]
                                                   (swap! notifications conj [content status]))
                              shui/dialog-close-all! (constantly nil)
                              ui-handler/re-render-root! (constantly nil)]
                (@#'import-handler/import-edn-data-from-form (atom {:import-data edn-string}) nil))]
      {:applied-ops @applied-ops
       :notifications @notifications})))

(deftest import-edn-block-without-current-block-does-not-import-test
  (async done
    (-> (p/let [{:keys [applied-ops notifications]}
                (<submit-import-edn-form "{:logseq.db.sqlite.export/block {:block/title \"b1\"}
                                          :pages-and-blocks []
                                          :logseq.db.sqlite.export/export-type :block}")]
          (is (empty? applied-ops) "Nothing is imported without a block to import into")
          (is (= [:warning] (map second notifications))
              "Only the no block found warning is shown"))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest import-edn-page-without-current-block-imports-test
  (async done
    (-> (p/let [{:keys [applied-ops notifications]}
                (<submit-import-edn-form "{:pages-and-blocks [{:page {:block/title \"page1\"}}]
                                          :logseq.db.sqlite.export/export-type :page}")]
          (testing "Importing something other than a block does not need a current block"
            (is (= [:batch-import-edn] (map first applied-ops)))
            (is (= [:success] (map second notifications)))))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest import-from-sqlite-db-persists-import-marker-through-worker-test
  (async done
    (let [calls (atom [])
          graph (str config/db-version-prefix "imported")]
      (-> (p/with-redefs [persist-db/<import-db
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
            (import-handler/import-from-sqlite-db! "buffer" "imported" #(swap! calls conj [:finished])))
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
          (p/finally done)))))
