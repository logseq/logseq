(ns frontend.worker.handler.query-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
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

(deftest custom-leaf-query-ignores-recycled-child-block
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:streamOf {:logseq.property/type :node}}
               :classes {:stream {}}
               :pages-and-blocks
               [{:page {:block/title "parent" :build/tags [:stream]}}
                {:page {:block/title "container"}
                 :blocks [{:block/title "child" :build/tags [:stream]
                           :build/properties
                           {:streamOf [:build/page {:block/title "parent"}]}}]}]})
        child (db-test/find-block-by-content @conn "child")]
    (is (= #{"child"} (custom-titles @conn leaf-query)))
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [child] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn (:db/id child)))))
    (is (= #{"parent"} (custom-titles @conn leaf-query)))))

(deftest custom-leaf-query-ignores-descendants-of-recycled-page
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:streamOf {:logseq.property/type :node}}
               :classes {:stream {}}
               :pages-and-blocks
               [{:page {:block/title "parent" :build/tags [:stream]}}
                {:page {:block/title "container"}
                 :blocks [{:block/title "child" :build/tags [:stream]
                           :build/properties
                           {:streamOf [:build/page {:block/title "parent"}]}}]}]})
        container (ldb/get-page @conn "container")
        child (db-test/find-block-by-content @conn "child")]
    (is (= #{"child"} (custom-titles @conn leaf-query)))
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn container {}) {:outliner-op :delete-page})
    (is (nil? (:logseq.property/deleted-at (d/entity @conn (:db/id child)))))
    (is (true? (ldb/recycled? (d/entity @conn (:db/id child))))
        "Child block is recycled via its page, without its own deleted-at")
    (is (some? (:user.property/streamOf (d/entity @conn (:db/id child)))))
    (is (= #{"parent"} (custom-titles @conn leaf-query))
        "A recycled page's descendants must not keep the parent from becoming a leaf")))

(deftest dsl-query-excludes-recycled-pages
  (let [conn (stream-graph)
        child (ldb/get-page @conn "child")]
    (is (= #{"parent" "child"} (dsl-titles @conn "(tags stream)")))
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn child {}) {:outliner-op :delete-page})
    (is (= #{"parent"} (dsl-titles @conn "(tags stream)")))))
