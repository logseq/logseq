(ns frontend.handler.db-based.import-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.db-based.import :as db-import]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- submit-dialog!
  [dialog-content export-map button-element]
  (db-import/import-edn-data-dialog)
  (let [[_ _ textarea button] @dialog-content]
    ((:on-change (second textarea))
     #js {:target #js {:value (pr-str export-map)}})
    ((:on-click (second button))
     #js {:currentTarget button-element})))

(deftest import-edn-data-preflight-test
  (let [dialog-content (atom nil)
        notifications (atom [])
        close-count (atom 0)
        request-count (atom 0)]
    (with-redefs [i18n/t identity
                  state/get-editor-args (constantly nil)
                  shui/dialog-open! (fn [content & _] (reset! dialog-content content))
                  shui/dialog-close! (fn [dialog-id]
                                       (when (not= :ls-dialog-cmdk dialog-id)
                                         (swap! close-count inc)))
                  shui/textarea (fn [props] [:textarea props])
                  shui/button (fn [props child] [:button props child])
                  notification/show! (fn [content status & [clear?]]
                                       (swap! notifications conj [content status clear?]))
                  db-transact/apply-outliner-ops (fn [& _]
                                                   (swap! request-count inc)
                                                   (p/resolved {}))]
      (testing "full graph datoms are rejected"
        (submit-dialog! dialog-content
                        {::sqlite-export/graph-format :datoms :datoms []}
                        #js {:disabled false})
        (is (= [:import/full-graph-not-supported :error nil]
               (last @notifications))))
      (testing "empty input stays editable"
        (submit-dialog! dialog-content {} #js {:disabled false})
        (is (= [:import/unsupported-edn-data :warning nil]
               (last @notifications))))
      (testing "block import requires an editing target"
        (let [original-search-args (:search/args @state/state)]
          (try
            (state/set-state! :search/args nil)
            (submit-dialog! dialog-content
                            {::sqlite-export/block {:block/title "Imported block"}}
                            #js {:disabled false})
            (is (= [:import/block-target-required-warning :warning false]
                   (last @notifications)))
            (finally
              (state/set-state! :search/args original-search-args)))))
      (is (= 2 @close-count))
      (is (zero? @request-count)))))

(deftest import-edn-data-uses-command-editor-target-test
  (async done
    (let [dialog-content (atom nil)
          submitted-ops (atom nil)
          target-uuid (random-uuid)
          page-uuid (random-uuid)
          target-block {:block/uuid target-uuid
                        :block/page {:block/uuid page-uuid}}
          export-map {::sqlite-export/block {:block/title "Imported block"}}
          original-search-args (:search/args @state/state)]
      (-> (p/with-redefs
            [i18n/t identity
             state/get-editor-args (constantly nil)
             db/entity (fn [lookup]
                         (when (= [:block/uuid target-uuid] lookup)
                           target-block))
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
            (submit-dialog! dialog-content export-map #js {:disabled false}))
          (p/then (fn []
                    (is (= {:current-block target-block
                            :existing-pages-keep-properties? true
                            :import-edn-data? true}
                           (get-in @submitted-ops [0 1 1])))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally (fn []
                       (state/set-state! :search/args original-search-args)
                       (done)))))))

(deftest import-edn-data-blocks-concurrent-submission-test
  (async done
    (let [dialog-content (atom nil)
          notifications (atom [])
          close-count (atom 0)
          request-count (atom 0)
          request (atom (p/deferred))
          button-element #js {:disabled false}
          export-map {:pages-and-blocks [{:page {:block/title "Page"}}]}]
      (-> (p/with-redefs
            [i18n/t identity
             shui/dialog-open! (fn [content & _] (reset! dialog-content content))
             shui/dialog-close! (fn [dialog-id]
                                  (when (not= :ls-dialog-cmdk dialog-id)
                                    (swap! close-count inc)))
             shui/textarea (fn [props] [:textarea props])
             shui/button (fn [props child] [:button props child])
             notification/show! (fn [content status & _]
                                   (swap! notifications conj [content status]))
             db-transact/apply-outliner-ops (fn [& _]
                                              (swap! request-count inc)
                                              @request)]
            (db-import/import-edn-data-dialog)
            (let [[_ _ textarea button] @dialog-content
                  click! (:on-click (second button))]
              ((:on-change (second textarea))
               #js {:target #js {:value (pr-str export-map)}})
              (let [result (click! #js {:currentTarget button-element})]
                (click! #js {:currentTarget button-element})
                (is (true? (.-disabled button-element)))
                (p/resolve! @request {:error "Unsupported attribute :sample/field"})
                (-> result
                    (p/then (fn []
                              (is (= 1 @request-count))
                              (is (false? (.-disabled button-element)))
                              (is (= [["Unsupported attribute :sample/field" :error]]
                                     @notifications))
                              (is (zero? @close-count))
                              (reset! request (p/deferred))
                              (let [result' (submit-dialog! dialog-content export-map button-element)]
                                (p/resolve! @request {})
                                result')))
                    (p/then (fn []
                              (is (= 2 @request-count))
                              (is (false? (.-disabled button-element)))
                              (is (= [:import/successful :success] (last @notifications)))
                              (is (= 1 @close-count))))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))
