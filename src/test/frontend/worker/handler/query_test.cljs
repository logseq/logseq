(ns frontend.worker.handler.query-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.handler.query :as query-handler]
            [frontend.worker.query-dsl :as query-dsl]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.recycle :as recycle]))

(def ^:private leaf-query
  '[:find [?title ...]
    :where
    [?s :block/tags ?tag]
    [?tag :block/title "stream"]
    [?s :block/title ?title]
    (not [?child :user.property/streamOf ?s])])

(defn- stream-graph
  []
  (db-test/create-conn-with-blocks
   {:properties {:streamOf {:logseq.property/type :node}}
    :classes {:stream {}}
    :pages-and-blocks
    [{:page {:block/title "parent" :build/tags [:stream]}}
     {:page {:block/title "child" :build/tags [:stream]
             :build/properties {:streamOf [:build/page {:block/title "parent"}]}}}]}))

(defn- custom-titles
  [db query]
  (set (query-handler/execute-custom-query db {:query query} {})))

(defn- dsl-titles
  [db query-string]
  (->> (query-dsl/execute-query query-string db {:block-attrs [:block/title]})
       (map (comp :block/title first))
       set))

(deftest custom-leaf-query-ignores-recycled-child-page
  (let [conn (stream-graph)
        child (ldb/get-page @conn "child")]
    (is (= #{"child"} (custom-titles @conn leaf-query))
        "Before delete, only the child is a leaf")
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn child {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (ldb/get-page @conn "child"))))
    (is (some? (:user.property/streamOf (ldb/get-page @conn "child")))
        "Soft delete keeps the child's node ref")
    (is (= #{"parent"} (custom-titles @conn leaf-query))
        "Recycled child must not satisfy (not [?child :streamOf ?parent])")
    (is (true? (recycle/restore! conn (:block/uuid child))))
    (is (= #{"child"} (custom-titles @conn leaf-query))
        "Restore puts the child back into query evaluation")))

(deftest dsl-query-excludes-recycled-pages
  (let [conn (stream-graph)
        child (ldb/get-page @conn "child")]
    (is (= #{"parent" "child"} (dsl-titles @conn "(tags stream)")))
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn child {}) {:outliner-op :delete-page})
    (is (= #{"parent"} (dsl-titles @conn "(tags stream)")))))
