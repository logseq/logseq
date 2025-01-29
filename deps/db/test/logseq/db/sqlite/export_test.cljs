(ns logseq.db.sqlite.export-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(deftest import-in-same-graph
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:default-many {:logseq.property/type :default :db/cardinality :many}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "export"
                           :build/properties {:default-many #{"foo" "bar" "baz"}}}
                          {:block/title "import"}]}]})
        export-block (db-test/find-block-by-content @conn "export")
        import-block* (db-test/find-block-by-content @conn "import")
        {:keys [init-tx block-props-tx]}
        (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
             (sqlite-export/merge-export-map (db-test/find-block-by-content @conn "import"))
             (sqlite-export/build-entity-import @conn))
        _ (assert (empty? block-props-tx) "This is empty for properties that already exist and thus no transacted")
        _ (d/transact! conn init-tx)
        import-block (d/entity @conn (:db/id import-block*))]
    (is (= []
           (filter #(or (:db/id %) (:db/ident %)) init-tx))
        "Tx doesn't try to create new blocks or modify existing idents")

    (is (= "export" (:block/title import-block))
        "imported block title equals exported one")
    (is (= {:user.property/default-many #{"foo" "bar" "baz"}}
           (db-test/readable-properties import-block))
        "imported block properties equals exported one")))

(deftest import-in-different-graph
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:num-many {:logseq.property/type :number
                                       :db/cardinality :many
                                       :block/title "Num Many"
                                       :logseq.property/hide? true}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "export"
                           :build/properties {:num-many #{3 6 9}}}]}]})
        conn2 (db-test/create-conn-with-blocks
               {:pages-and-blocks [{:page {:block/title "page2"}
                                    :blocks [{:block/title "import"}
                                             {:block/title "import2"}]}]})
        export-block (db-test/find-block-by-content @conn "export")
        import-block* (db-test/find-block-by-content @conn2 "import")
        {:keys [init-tx block-props-tx] :as _txs}
        (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
             (sqlite-export/merge-export-map import-block*)
             (sqlite-export/build-entity-import @conn2))
        _ (assert (nil? (d/entity @conn2 :user.property/num-many)) "Does not have imported property")
        _ (d/transact! conn2 init-tx)
        _ (d/transact! conn2 block-props-tx)
        ;; _ (cljs.pprint/pprint _txs)
        import-block (d/entity @conn2 (:db/id import-block*))]

    (is (some? (d/entity @conn2 :user.property/num-many))
        "New user property is imported")
    (is (= {:logseq.property/hide? true
            :block/title "Num Many"}
           (select-keys (d/entity @conn2 :user.property/num-many)
                             [:block/title :logseq.property/hide?]))
        "New user property has title and schema properties copied over")

    (is (= "export" (:block/title import-block))
        "imported block title equals exported one")
    (is (= {:user.property/num-many #{3 6 9}}
           (db-test/readable-properties import-block))
        "imported block properties equals exported one")

    (testing "importing a 2nd time is idempotent"
      (let [import-block2* (db-test/find-block-by-content @conn2 "import2")
            {:keys [init-tx block-props-tx] :as _txs}
            (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
                 (sqlite-export/merge-export-map import-block2*)
                 (sqlite-export/build-entity-import @conn2))
            _ (assert (empty? block-props-tx) "This is empty for properties that already exist and thus no transacted")
            _ (d/transact! conn2 init-tx)
            import-block2 (d/entity @conn2 (:db/id import-block2*))]
        (is (= "export" (:block/title import-block2))
            "imported block title equals exported one")
        (is (= {:user.property/num-many #{3 6 9}}
               (db-test/readable-properties import-block))
            "imported block properties equals exported one")))))