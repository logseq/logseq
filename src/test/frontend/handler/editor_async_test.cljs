(ns frontend.handler.editor-async-test
  (:require [frontend.handler.editor :as editor]
            [frontend.db :as db]
            [clojure.test :refer [is testing async use-fixtures]]
            [datascript.core :as d]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async load-test-files]]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(use-fixtures :each
  {:before (fn []
             (async done
                    (test-helper/start-test-db!)
                    (done)))
   :after test-helper/destroy-test-db!})

(defn- delete-block
  [db block {:keys [embed? on-delete]}]
  (let [sibling-block (ldb/get-left-sibling (d/entity db (:db/id block)))
        first-block (ldb/get-left-sibling sibling-block)
        block-dom-id "ls-block-block-to-delete"]
    (test-helper/with-reset
      reset
      [editor/get-state (constantly {:block-id (:block/uuid block)
                                     :block-parent-id block-dom-id
                                     :config {:embed? embed?}})
                  ;; stub for delete-block
       gdom/getElement (constantly #js {:id block-dom-id})
                  ;; stub since not testing moving
       editor/edit-block! (constantly nil)
                  ;; stub b/c of js/document
       state/get-selection-blocks (constantly [])
       util/get-blocks-noncollapse (constantly (mapv
                                                (fn [m]
                                                  #js {:id (:id m)
                                                                  ;; for dom/attr
                                                       :getAttribute #({"blockid" (str (:block-uuid m))
                                                                        "data-embed" (if embed? "true" "false")} %)})
                                                [{:id "ls-block-first-block"
                                                  :block-uuid (:block/uuid first-block)}
                                                 {:id "ls-block-sibling-block"
                                                  :block-uuid (:block/uuid sibling-block)}
                                                 {:id block-dom-id
                                                  :block-uuid (:block/uuid block)}]))]
      (p/do!
       (editor/delete-block! test-helper/test-db)
       (when (fn? on-delete)
         (on-delete))
       (reset)))))

(deftest-async delete-block-async!
  (testing "backspace deletes empty block"
    (load-test-files [{:file/path "pages/page1.md"
                       :file/content "\n
- b1
- b2
-"}])
    (p/let [conn (db/get-db test-helper/test-db false)
            block (->> (d/q '[:find (pull ?b [*])
                              :where [?b :block/title ""]
                              [?p :block/name "page1"]
                              [?b :block/page ?p]]
                            @conn)
                       ffirst)]
      (delete-block @conn block
                    {:on-delete (fn []
                                  (let [updated-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?b :block/parent]
                                                                   [?b :block/title]
                                                                   [(missing? $ ?b :block/pre-block?)]]
                                                                 @conn)
                                                            (map (comp :block/title first)))]
                                    (is (= ["b1" "b2"] updated-blocks) "Block is deleted")))})))

  (testing "backspace deletes empty block in embedded context"
    ;; testing embed at this layer doesn't require an embed block since
    ;; delete-block handles all the embed setup
    (load-test-files [{:file/path "pages/page1.md"
                       :file/content "\n
- b1
- b2
-"}])
    (p/let [conn (db/get-db test-helper/test-db false)
            block (->> (d/q '[:find (pull ?b [*])
                              :where [?b :block/title ""]
                              [?p :block/name "page1"]
                              [?b :block/page ?p]]
                            @conn)
                       ffirst)]
      (delete-block @conn block
                    {:embed? true
                     :on-delete (fn []
                                  (let [updated-blocks (->> (d/q '[:find (pull ?b [*])
                                                                   :where
                                                                   [?b :block/parent]
                                                                   [?b :block/title]
                                                                   [(missing? $ ?b :block/pre-block?)]]
                                                                 @conn)
                                                            (map (comp :block/title first)))]
                                    (is (= ["b1" "b2"] updated-blocks) "Block is deleted")))}))))
