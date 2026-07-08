(ns frontend.handler.editor-lifecycle-test
  (:require [cljs.test :refer [async deftest is]]
            [dommy.core :as dom]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.lifecycle :as lifecycle]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [promesa.core :as p]))

(deftest did-mount-records-editor-info-with-worker-page-lookup-test
  (async done
    (let [worker-calls (atom [])
          state-calls (atom [])
          page-uuid #uuid "77777777-7777-7777-7777-777777777777"]
      (-> (p/with-redefs [state/get-edit-content (constantly nil)
                          state/get-input (constantly nil)
                          state/get-edit-block (constantly {:db/id 42})
                          state/get-current-repo (constantly "logseq_db_lifecycle")
                          state/get-editor-info (constantly {:cursor 3})
                          state/get-state (constantly nil)
                          state/set-state! (fn [& args]
                                             (swap! state-calls conj (vec args)))
                          state/<invoke-db-worker
                          (fn [& args]
                            (swap! worker-calls conj (vec args))
                            (case (first args)
                              :thread-api/get-block-page-info
                              (p/resolved {:block/uuid page-uuid})

                              :thread-api/undo-redo-record-editor-info
                              (p/resolved :recorded)))
                          dom/attr (fn [& _] nil)
                          editor-handler/restore-cursor-pos! (fn [& _] nil)
                          util/rec-get-node (fn [& _] nil)
                          util/scroll-editor-cursor (fn [& _] nil)
                          gdom/getElement (fn [& _] nil)]
            (#'lifecycle/did-mount! "edit-input" {})
            (js/Promise. (fn [resolve] (js/setTimeout resolve 0))))
          (p/then
           (fn [_]
             (is (= [[:thread-api/get-block-page-info
                      "logseq_db_lifecycle"
                      42]
                     [:thread-api/undo-redo-record-editor-info
                      "logseq_db_lifecycle"
                      {:cursor 3}]]
                    @worker-calls))
             (is (= [[:editor/op nil]]
                    @state-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
