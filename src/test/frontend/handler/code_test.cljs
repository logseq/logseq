(ns frontend.handler.code-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.async :as db-async]
            [frontend.handler.code :as code-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest save-code-editor-saves-graph-file-after-worker-file-lookup-test
  (async done
    (let [repo "logseq_db_code_handler"
          worker-calls (atom [])
          saved-files (atom [])
          textarea #js {:dataset #js {:v "old content"}
                        :defaultValue "old content"
                        :value "new content"}
          editor #js {:save (fn [])
                      :getTextArea (fn [] textarea)}
          previous-state @state/state]
      (swap! state/state assoc
             :git/current-repo repo
             :editor/code-block-context {:config {:file-path "logseq/config.edn"}
                                         :state nil
                                         :editor editor})
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [& args]
                            (swap! worker-calls conj args)
                            (p/resolved {:db/id 1}))
                          db-editor-handler/save-file!
                          (fn [path content]
                            (swap! saved-files conj [path content])
                            (p/resolved nil))]
            (code-handler/save-code-editor!))
          (p/then
           (fn [_]
            (is (= [[:thread-api/pull repo [:db/id] [:file/path "logseq/config.edn"]]]
                   @worker-calls))
            (is (= [["logseq/config.edn" "new content"]]
                    @saved-files))
             (is (= "new content" (.-v ^js (.-dataset textarea))))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/state previous-state)
             (done)))))))

(deftest save-code-editor-saves-code-snippet-after-worker-block-lookup-test
  (async done
    (let [repo "logseq_db_code_block_handler"
          block-uuid (random-uuid)
          block {:db/id 42
                 :block/uuid block-uuid
                 :block/raw-title "aaOLDzz"}
          edit-content (atom nil)
          saved-block (atom nil)
          textarea #js {:dataset #js {:v "OLD"}
                        :defaultValue "OLD"
                        :value "NEW"}
          editor #js {:save (fn [])
                      :getTextArea (fn [] textarea)}
          previous-state @state/state]
      (swap! state/state assoc
             :git/current-repo repo
             :editor/code-block-context {:config {:block/uuid block-uuid}
                                         :state {:code-options (atom {:pos_meta {:start_pos 4
                                                                                 :end_pos 7}})}
                                         :editor editor})
      (-> (p/with-redefs [db-async/<get-block
                          (fn [repo' block-id opts]
                            (is (= repo repo'))
                            (is (= block-uuid block-id))
                            (is (= {:children? false} opts))
                            (p/resolved block))
                          state/get-edit-input-id
                          (constantly "edit-input")
                          state/set-edit-content!
                          (fn [input-id content]
                            (reset! edit-content [input-id content]))
                          editor-handler/save-block-if-changed!
                          (fn [block' content]
                            (reset! saved-block [block' content])
                            (p/resolved nil))]
            (code-handler/save-code-editor!))
          (p/then
           (fn [_]
             (is (= ["edit-input" "aaNEW\nzz"] @edit-content))
             (is (= [block "aaNEW\nzz"] @saved-block))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (reset! state/state previous-state)
             (done)))))))
