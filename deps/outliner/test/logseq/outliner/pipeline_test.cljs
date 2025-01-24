(ns logseq.outliner.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- get-blocks [db]
  (->> (d/q '[:find (pull ?b [* {:block/path-refs [:block/name :db/id]}])
              :in $
              :where
              [?b :block/page]
              [?b :block/title]
              [(missing? $ ?b :logseq.property/built-in?)]]
            db)
       (map first)))

(deftest compute-block-path-refs-tx
  (testing "when a block's :refs change, descendants of block have correct :block/path-refs"
    (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
          ;; needed in order for path-refs to be setup correctly with init data
          _ (db-pipeline/add-listener conn)
          _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
          _ (sqlite-build/create-blocks
             conn
             [{:page {:block/title "bar"}}
              {:page {:block/title "page1"}
               :blocks [{:block/title "parent [[foo]]"
                         :build/children
                         [{:block/title "child [[baz]]"
                           :build/children
                           [{:block/title "grandchild [[bing]]"}]}]}]}])
          blocks (get-blocks @conn)
          ;; Update parent block to replace 'foo' with 'bar' ref
          new-tag-id (ffirst (d/q '[:find ?b :where [?b :block/title "bar"]] @conn))
          modified-blocks (map #(if (string/starts-with? (:block/title %) "parent")
                                  (assoc %
                                         :block/refs [{:db/id new-tag-id}]
                                         :block/path-refs [{:db/id new-tag-id}])
                                  %)
                               blocks)
          refs-tx (outliner-pipeline/compute-block-path-refs-tx {:db-after @conn} modified-blocks)
          _ (d/transact! conn refs-tx {:pipeline-replace? true})
          updated-blocks (->> (get-blocks @conn)
                              ;; Only keep enough of content to uniquely identify block
                              (map #(hash-map :block/title (re-find #"\w+" (:block/title %))
                                              :path-ref-names (set (map :block/name (:block/path-refs %))))))
          page-tag-refs #{"page" "tags"}]
      (is (= [{:block/title "parent"
               :path-ref-names (set/union page-tag-refs #{"page1" "bar"})}
              {:block/title "child"
               :path-ref-names (set/union page-tag-refs #{"page1" "bar" "baz"})}
              {:block/title "grandchild"
               :path-ref-names (set/union page-tag-refs #{"page1" "bar" "baz" "bing"})}]
             updated-blocks)))))

(deftest block-content-refs
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}])
        block (db-test/find-block-by-content @conn "b1")]
    (assert block)
    (is (= [(:db/id block)]
           (outliner-pipeline/block-content-refs @conn
                                                 {:block/title (str "ref to " (page-ref/->page-ref (:block/uuid block)))})))))
