(ns logseq.db.frontend.query-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.query :as db-query]
            [logseq.db.test.helper :as db-test]))

(def ^:private leaf-query
  '[:find [?title ...]
    :where
    [?s :block/tags ?tag]
    [?tag :block/title "stream"]
    [?s :block/title ?title]
    (not [?child :user.property/streamOf ?s])])

(def ^:private stream-titles-query
  '[:find [?title ...]
    :where
    [?s :block/tags ?tag]
    [?tag :block/title "stream"]
    [?s :block/title ?title]])

(def ^:private stream-count-query
  '[:find (count ?s) .
    :where
    [?s :block/tags ?tag]
    [?tag :block/title "stream"]])

(def ^:private stream-of-titles-query
  '[:find [?title ...]
    :where
    [?s :user.property/streamOf ?target]
    [?s :block/title ?title]])

(defn- stream-conn
  []
  (db-test/create-conn-with-blocks
   {:properties {:streamOf {:logseq.property/type :node}}
    :classes {:stream {}}
    :pages-and-blocks
    [{:page {:block/title "parent" :build/tags [:stream]}}
     {:page {:block/title "child" :build/tags [:stream]
             :build/properties {:streamOf [:build/page {:block/title "parent"}]}}}]}))

(defn- mark-deleted!
  [conn title]
  (let [page (ldb/get-page @conn title)]
    (d/transact! conn [[:db/add (:db/id page) :logseq.property/deleted-at 1]])
    page))

(deftest without-recycled-returns-same-db-when-nothing-is-recycled
  (let [conn (stream-conn)]
    (is (identical? @conn (db-query/without-recycled @conn)))))

(deftest recycled-eids-include-deleted-root-and-page-descendants
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "parent"}
                 :blocks [{:block/title "nested"}]}
                {:page {:block/title "child-page"}}]})
        parent (ldb/get-page @conn "parent")
        nested (db-test/find-block-by-content @conn "nested")
        child-page (ldb/get-page @conn "child-page")
        _ (d/transact! conn [[:db/add (:db/id child-page) :block/parent (:db/id parent)]
                             [:db/add (:db/id parent) :logseq.property/deleted-at 1]])
        recycled (db-query/recycled-eids @conn)]
    (is (contains? recycled (:db/id parent)))
    (is (contains? recycled (:db/id nested))
        "Blocks on a recycled page are excluded even without deleted-at")
    (is (contains? recycled (:db/id child-page))
        "Child pages of a recycled page are excluded even without deleted-at")))

(deftest recycled-child-does-not-block-leaf-query
  (let [conn (stream-conn)
        child (mark-deleted! conn "child")
        raw-leaves (set (d/q leaf-query @conn))
        leaves (set (d/q leaf-query (db-query/without-recycled @conn)))]
    (is (some? (:user.property/streamOf (d/entity @conn (:db/id child))))
        "Recycle keeps the child's node ref; evaluation must ignore it")
    (is (not (contains? raw-leaves "parent"))
        "Raw d/q still sees the recycled child")
    (is (= #{"parent"} leaves))))

(deftest recycled-entities-are-absent-from-find-and-aggregates
  (let [conn (stream-conn)
        _ (mark-deleted! conn "child")
        query-db (db-query/without-recycled @conn)]
    (is (= #{"parent" "child"} (set (d/q stream-titles-query @conn))))
    (is (= #{"parent"} (set (d/q stream-titles-query query-db))))
    (is (= 2 (d/q stream-count-query @conn)))
    (is (= 1 (d/q stream-count-query query-db)))))

(deftest refs-to-recycled-targets-do-not-match
  (let [conn (stream-conn)
        _ (mark-deleted! conn "parent")
        query-db (db-query/without-recycled @conn)]
    (is (= #{"child"} (set (d/q stream-of-titles-query @conn)))
        "Raw d/q still joins through a recycled target")
    (is (= #{} (set (d/q stream-of-titles-query query-db)))
        "Filtered evaluation matches permanent-delete semantics for incoming refs")))
