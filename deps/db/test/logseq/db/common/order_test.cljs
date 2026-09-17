(ns logseq.db.common.order-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]))

(deftest missing-internal-page-parent-order-tx-repairs-nested-pages
  (let [conn (db-test/create-conn)
        library (ldb/get-built-in-page @conn "Library")
        parent-uuid (random-uuid)
        child-a-uuid (random-uuid)
        child-b-uuid (random-uuid)
        class-uuid (random-uuid)]
    (d/transact! conn
                 [{:db/id "parent"
                   :block/uuid parent-uuid
                   :block/title "Country"
                   :block/name "country"
                   :block/tags :logseq.class/Page
                   :block/parent (:db/id library)
                   :block/order "a0"}
                  {:block/uuid child-a-uuid
                   :block/title "Australia"
                   :block/name "australia"
                   :block/tags :logseq.class/Page
                   :block/parent "parent"}
                  {:block/uuid child-b-uuid
                   :block/title "Canada"
                   :block/name "canada"
                   :block/tags :logseq.class/Page
                   :block/parent "parent"}
                  {:block/uuid (random-uuid)
                   :block/title "Overview"
                   :block/page "parent"
                   :block/parent "parent"
                   :block/order "a0"}
                  {:block/uuid class-uuid
                   :block/title "Place"
                   :block/name "place"
                   :block/tags :logseq.class/Tag
                   :db/ident :user.class/place
                   :logseq.property.class/extends :logseq.class/Root
                   :block/parent "parent"}])
    (d/transact! conn (db-order/missing-internal-page-parent-order-tx @conn))
    (let [child-a (d/entity @conn [:block/uuid child-a-uuid])
          child-b (d/entity @conn [:block/uuid child-b-uuid])
          overview (db-test/find-block-by-content @conn "Overview")
          class (d/entity @conn [:block/uuid class-uuid])]
      (is (string? (:block/order child-a)))
      (is (string? (:block/order child-b)))
      (is (not= (:block/order child-a) (:block/order child-b)))
      (is (pos? (compare (:block/order child-a) (:block/order overview))))
      (is (pos? (compare (:block/order child-b) (:block/order overview))))
      (is (nil? (:block/order class))))))
