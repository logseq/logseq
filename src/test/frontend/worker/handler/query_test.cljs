(ns frontend.worker.handler.query-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.query :as query-handler]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.recycle :as recycle]))

(def ^:private leaf-query
  "Titles of the streams that no stream has as its parent"
  {:query '[:find [?title ...]
            :where
            [?s :block/tags ?tag]
            [?tag :block/title "stream"]
            [?s :block/title ?title]
            (not [?child :user.property/streamOf ?s])]})

(defn- leaves
  [conn]
  (set (query-handler/execute-custom-query @conn leaf-query {})))

(defn- create-streams-conn
  [pages-and-blocks]
  (db-test/create-conn-with-blocks
   {:properties {:streamOf {:logseq.property/type :node}}
    :classes {:stream {}}
    :pages-and-blocks pages-and-blocks}))

(deftest custom-query-ignores-recycled-page-test
  (let [conn (create-streams-conn
              [{:page {:block/title "parent" :build/tags [:stream]}}
               {:page {:block/title "child" :build/tags [:stream]
                       :build/properties {:streamOf [:build/page {:block/title "parent"}]}}}])
        child (db-test/find-page-by-title @conn "child")]
    (is (= #{"child"} (leaves conn))
        "The parent has a child")
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn child {}) {:outliner-op :delete-page})
    (is (ldb/recycled? (db-test/find-page-by-title @conn "child")))
    (is (= #{"parent"} (leaves conn))
        "A recycled child no longer makes its parent a non-leaf")
    (recycle/restore! conn (:block/uuid child))
    (is (= #{"child"} (leaves conn))
        "A restored child counts again")))

(deftest custom-query-ignores-descendants-of-recycled-block-test
  (let [conn (create-streams-conn
              [{:page {:block/title "parent" :build/tags [:stream]}}
               {:page {:block/title "host"}
                :blocks [{:block/title "root"
                          :build/children
                          [{:block/title "nested"
                            :build/properties {:streamOf [:build/page {:block/title "parent"}]}}]}]}])
        root (db-test/find-block-by-content @conn "root")]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [root] {}) {:outliner-op :delete-blocks})
    (let [nested (db-test/find-block-by-content @conn "nested")]
      (is (nil? (:logseq.property/deleted-at nested))
          "Only the root of a recycled subtree carries deleted-at")
      (is (ldb/recycled? nested)))
    (testing "the query sees the same graph as if the subtree were deleted for good"
      (is (= #{"parent"} (leaves conn))))
    (is (some? (d/entity @conn [:block/uuid (:block/uuid (db-test/find-block-by-content @conn "nested"))]))
        "The recycled block is still in the graph")))
