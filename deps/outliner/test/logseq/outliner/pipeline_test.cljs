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
