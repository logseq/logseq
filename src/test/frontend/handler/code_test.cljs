(ns frontend.handler.code-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.db.async :as db-async]
            [frontend.handler.code :as code]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- fake-code-editor
  "Minimal CodeMirror 6 context map: `:view` exposes `state.doc.toString()`,
   `:*state` holds the tracked default value."
  [value default-value]
  {:view #js {:state #js {:doc (reify Object (toString [_] value))}}
   :*state (atom {:default-value default-value})})

(deftest save-code-editor-saves-graph-file-after-worker-file-lookup-test
  (async done
    (let [repo "logseq_db_code_handler"
          worker-calls (atom [])
          saved-files (atom [])
          editor (fake-code-editor "new content" "old content")
          previous-state (state/get-state)]
      (state/swap-state! assoc
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
            (code/save-code-editor!))
          (p/then
           (fn [_]
             (is (= [[:thread-api/pull repo [:db/id] [:file/path "logseq/config.edn"]]]
                    @worker-calls))
             (is (= [["logseq/config.edn" "new content"]]
                    @saved-files))
             (is (= "new content"
                    (:default-value @(:*state editor))))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (state/replace-state! previous-state)
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
          editor (fake-code-editor "NEW" "OLD")
          previous-state (state/get-state)]
      (state/swap-state! assoc
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
            (code/save-code-editor!))
          (p/then
           (fn [_]
             (is (= ["edit-input" "aaNEW\nzz"] @edit-content))
             (is (= [block "aaNEW\nzz"] @saved-block))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (state/replace-state! previous-state)
             (done)))))))

(deftest fenced-code-content-test
  (testing "byte offsets from :pos_meta splice the new value into block content"
    (is (= "```clojure\n(+ 1 2)\n```"
           (code/fenced-code-content "```clojure\n(+ 1 1)\n```"
                                     {:start_pos 13 :end_pos 21}
                                     "(+ 1 2)")))
    (is (= "```calc\n1 = 1\n```"
           (code/fenced-code-content "```calc\n1 = 0\n```"
                                     {:start_pos 10 :end_pos 16}
                                     "1 = 1")))
    (testing "blank values remove the fenced body"
      (is (= "```clojure\n```"
             (code/fenced-code-content "```clojure\n(+ 1 1)\n```"
                                       {:start_pos 13 :end_pos 21}
                                       ""))))
    (testing "utf8 content keeps byte-accurate offsets"
      (is (= "```\n你好\n```"
             (code/fenced-code-content "```\n世界\n```"
                                       {:start_pos 6 :end_pos 13}
                                       "你好"))))))
