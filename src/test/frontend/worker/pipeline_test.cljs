(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is use-fixtures testing]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.test.helper :as test-helper :refer [load-test-files]]))

(use-fixtures :each test-helper/start-and-destroy-db)

(defn- get-blocks [db]
  (->> (d/q '[:find (pull ?b [* {:block/path-refs [:block/name :db/id]}])
              :in $
              :where [?b :block/content] [(missing? $ ?b :block/pre-block?)]]
            db)
       (map first)))

;; TODO: Move this test to outliner dep when there is a load-test-files helper for deps
(deftest compute-block-path-refs-tx
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "prop:: #bar
- parent #foo
  - child #baz
    - grandchild #bing"}])
  (testing "when a block's :refs change, descendants of block have correct :block/path-refs"
    (let [conn (db/get-db test-helper/test-db false)
          blocks (get-blocks @conn)
          ;; Update parent block to replace #foo with #bar
          new-tag-id (:db/id (db/get-page "bar"))
          modified-blocks (map #(if (= "parent #foo" (:block/content %))
                                  (assoc %
                                         :block/refs [{:db/id new-tag-id}]
                                         :block/path-refs [{:db/id new-tag-id}])
                                  %)
                               blocks)
          refs-tx (worker-pipeline/compute-block-path-refs-tx {:tx-meta {:outliner-op :save-block} :db-after @conn} modified-blocks)
          _ (d/transact! conn refs-tx)
          updated-blocks (->> (get-blocks @conn)
                              (map #(hash-map :block/content (:block/content %)
                                              :path-ref-names (mapv :block/name (:block/path-refs %)))))]
      (is (= [;; still have old parent content b/c we're only testing :block/path-refs updates
              {:block/content "parent #foo"
               :path-ref-names ["page1" "bar"]}
              {:block/content "child #baz"
               :path-ref-names ["page1" "bar" "baz"]}
              {:block/content "grandchild #bing"
               :path-ref-names ["page1" "bar" "baz" "bing"]}]
             updated-blocks)))))
