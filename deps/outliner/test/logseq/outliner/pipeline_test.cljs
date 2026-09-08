(ns logseq.outliner.pipeline-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(deftest block-content-refs
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}])
        block (db-test/find-block-by-content @conn "b1")]
    (assert block)
    (is (= [(:db/id block)]
           (outliner-pipeline/block-content-refs @conn
                                                 {:block/title (str "ref to " (page-ref/->page-ref (:block/uuid block)))})))))

(deftest db-rebuild-block-refs-for-query-block
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "Todo query"
                           :build/tags [:logseq.class/Query]
                           :build/properties
                           {:logseq.property/query
                            {:build/property-value :block
                             :block/title "(task Todo)"}}}]}]})
        block (db-test/find-block-by-content @conn "Todo query")
        refs (set (outliner-pipeline/db-rebuild-block-refs @conn block))
        query-property-id (:db/id (d/entity @conn :logseq.property/query))
        query-class-id (:db/id (d/entity @conn :logseq.class/Query))]
    (is (some? query-property-id)
        "Sanity: :logseq.property/query entity exists")
    (is (contains? refs query-class-id)
        "#Query class tag is included in :block/refs")
    (is (not (contains? refs query-property-id))
        "#Query block does not reference logseq.property/query through :block/refs")))

(deftest db-rebuild-block-refs-removes-recursive-self-ref
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "self"}]}])
        block (db-test/find-block-by-content @conn "self")
        block' (assoc (d/pull @conn '[:db/id :block/uuid :block/title] (:db/id block))
                      :block/title
                      (str "self " (page-ref/->page-ref (:block/uuid block))))]
    (is (empty? (outliner-pipeline/db-rebuild-block-refs @conn block'))
        "A block should not rebuild a recursive ref to itself")))

(deftest bulk-block-refs-preserve-datetime-and-content-rules
  (let [timestamp (.getTime (js/Date. 2026 8 8 12))
        conn (db-test/create-conn-with-import-map
              {:properties {:user.property/datetime {:logseq.property/type :datetime}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/datetime timestamp}}]}]})
        block (db-test/find-block-by-content @conn "b1")
        page (db-test/find-page-by-title @conn "page1")
        alias-uuid (random-uuid)
        journal-uuid (random-uuid)
        _ (d/transact! conn [{:db/id -1 :block/uuid journal-uuid
                              :block/title "Sep 8th, 2026" :block/journal-day 20260908
                              :block/tags [:logseq.class/Journal]}
                             {:db/id -2 :block/uuid alias-uuid :block/title "alias"}
                             {:db/id (:db/id block) :block/alias [-2]
                              :block/link (:db/id page)
                              :block/title (str (page-ref/->page-ref (:block/uuid block)) " "
                                                (page-ref/->page-ref alias-uuid) " "
                                                (page-ref/->page-ref (random-uuid)))}])
        db @conn
        updated-block (d/entity db (:db/id block))
        expected #{(:db/id page)
                   (:db/id (d/entity db :block/alias))
                   (:db/id (d/entity db [:block/uuid journal-uuid]))
                   (:db/id (d/entity db :user.property/datetime))}]
    (is (= expected (set (outliner-pipeline/db-rebuild-block-refs db updated-block))))
    (is (= expected (set ((outliner-pipeline/db-rebuild-block-refs-fn db) updated-block))))))
