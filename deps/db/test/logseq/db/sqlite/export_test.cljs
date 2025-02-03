(ns logseq.db.sqlite.export-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(deftest import-block-in-same-graph
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:default-many {:logseq.property/type :default :db/cardinality :many}}
               :classes {:MyClass {:build/class-properties [:default-many]}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "export"
                           :build/properties {:default-many #{"foo" "bar" "baz"}}
                           :build/tags [:MyClass]}
                          {:block/title "import"}]}]})
        export-block (db-test/find-block-by-content @conn "export")
        import-block* (db-test/find-block-by-content @conn "import")
        {:keys [init-tx block-props-tx]}
        (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
             (sqlite-export/build-import @conn {:current-block import-block*}))
        _ (assert (empty? block-props-tx) "This is empty for properties that already exist and thus no transacted")
        _ (d/transact! conn init-tx)
        import-block (d/entity @conn (:db/id import-block*))]
    (is (= []
           (filter #(or (:db/id %) (:db/ident %)) init-tx))
        "Tx doesn't try to create new blocks or modify existing idents")

    (is (= "export" (:block/title import-block))
        "imported block title equals exported one")
    (is (= {:user.property/default-many #{"foo" "bar" "baz"}
            :block/tags [:user.class/MyClass]}
           (db-test/readable-properties import-block))
        "imported block properties and tags equals exported one")))

(deftest import-block-in-different-graph
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:num-many {:logseq.property/type :number
                                       :db/cardinality :many
                                       :block/title "Num Many"
                                       :logseq.property/hide? true}}
               :classes {:MyClass {:block/title "My Class"
                                   :build/class-properties [:default-many :p1]}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "export"
                           :build/properties {:num-many #{3 6 9}}
                           :build/tags [:MyClass]}]}]})
        conn2 (db-test/create-conn-with-blocks
               {:pages-and-blocks [{:page {:block/title "page2"}
                                    :blocks [{:block/title "import"}
                                             {:block/title "import2"}]}]})
        export-block (db-test/find-block-by-content @conn "export")
        import-block* (db-test/find-block-by-content @conn2 "import")
        {:keys [init-tx block-props-tx] :as _txs}
        (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
             (sqlite-export/build-import @conn2 {:current-block import-block*}))
        _ (assert (nil? (d/entity @conn2 :user.property/num-many)) "Does not have imported property")
        _ (d/transact! conn2 init-tx)
        _ (d/transact! conn2 block-props-tx)
        ;; _ (cljs.pprint/pprint _txs)
        import-block (d/entity @conn2 (:db/id import-block*))]

    (is (ldb/property? (d/entity @conn2 :user.property/num-many))
        "New user property is imported")
    (is (= "Num Many"
           (:block/title (d/entity @conn2 :user.property/num-many))))
    (is (= {:db/cardinality :db.cardinality/many, :logseq.property/type :number, :logseq.property/hide? true}
           (db-property/get-property-schema (d/entity @conn2 :user.property/num-many)))
        "Imported property has correct schema properties")

    (is (= "My Class"
           (:block/title (d/entity @conn2 :user.class/MyClass))))
    (is (= {:logseq.property.class/properties #{"default-many" "p1"}
            :block/tags [:logseq.class/Tag]
            :logseq.property/parent :logseq.class/Root}
           (db-test/readable-properties (d/entity @conn2 :user.class/MyClass)))
        "New user class has correct tag and properties")
    (is (ldb/property? (d/entity @conn2 :user.property/p1))
        "New class property is property")

    (is (= "export" (:block/title import-block))
        "imported block title equals exported one")
    (is (= {:user.property/num-many #{3 6 9}
            :block/tags [:user.class/MyClass]}
           (db-test/readable-properties import-block))
        "imported block properties equals exported one")

    (testing "importing a 2nd time is idempotent"
      (let [import-block2* (db-test/find-block-by-content @conn2 "import2")
            {:keys [init-tx block-props-tx] :as _txs}
            (->> (sqlite-export/build-entity-export @conn [:block/uuid (:block/uuid export-block)])
                 (sqlite-export/build-import @conn2 {:current-block import-block2*}))
            _ (assert (empty? block-props-tx) "This is empty for properties that already exist and thus no transacted")
            _ (d/transact! conn2 init-tx)
            import-block2 (d/entity @conn2 (:db/id import-block2*))]
        (is (= "export" (:block/title import-block2))
            "imported block title equals exported one")
        (is (= {:user.property/num-many #{3 6 9}
                :block/tags [:user.class/MyClass]}
               (db-test/readable-properties import-block))
            "imported block properties equals exported one")))))

(deftest import-page-in-different-graph
  (let [original-data
        {:properties {:user.property/default {:logseq.property/type :default
                                              :db/cardinality :db.cardinality/one
                                              :block/title "Default"}
                      :user.property/p1 {:logseq.property/type :default
                                         :db/cardinality :db.cardinality/one
                                         :block/title "p1"}
                      :user.property/num {:logseq.property/type :number
                                          :db/cardinality :db.cardinality/one
                                          :block/title "num"}}
         :classes {:user.class/MyClass {:block/title "My Class"
                                        :build/class-properties [:user.property/default :user.property/p1]}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "b1"
                     :build/properties {:user.property/default "woot"}
                     :build/children [{:block/title "b1a"
                                       :build/children
                                       [{:block/title "b1aa"
                                         :build/properties {:user.property/num 2}}
                                        {:block/title "b1ab"}]}
                                      {:block/title "b1b"}]}
                    {:block/title "b2"
                     :build/tags [:user.class/MyClass]}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        page (db-test/find-page-by-title @conn "page1")
        conn2 (db-test/create-conn)
        {:keys [init-tx block-props-tx] :as _txs}
        (->> (sqlite-export/build-page-export @conn (:db/id page))
             (sqlite-export/build-import @conn2 {}))
        _ (assert (nil? (d/entity @conn2 :user.property/default)))
        _ (assert (nil? (d/entity @conn2 :user.class/MyClass)))
        _ (d/transact! conn2 init-tx)
        _ (d/transact! conn2 block-props-tx)
        ;; _ (cljs.pprint/pprint _txs)
        page2 (db-test/find-page-by-title @conn2 "page1")
        full-imported-page (sqlite-export/build-page-export @conn2 (:db/id page2))]

    (is (= (:properties original-data) (:properties full-imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes full-imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks full-imported-page))
        "Page's blocks are imported")

    (testing "importing a 2nd time appends blocks"
      (let [{:keys [init-tx block-props-tx] :as _txs}
            (->> (sqlite-export/build-page-export @conn (:db/id page))
                 (sqlite-export/build-import @conn2 {}))
            ;; _ (cljs.pprint/pprint _txs)
            _ (d/transact! conn2 init-tx)
            _ (d/transact! conn2 block-props-tx)
            full-imported-page (sqlite-export/build-page-export @conn2 (:db/id page2))
            expected-page-and-blocks
            (update-in (:pages-and-blocks original-data) [0 :blocks]
                       (fn [blocks] (into blocks blocks)))]
        (is (= expected-page-and-blocks (:pages-and-blocks full-imported-page)))))))

(deftest import-page-with-different-property-types
  (let [original-data
        {:properties {:user.property/num {:logseq.property/type :number
                                          :db/cardinality :db.cardinality/one
                                          :block/title "num"}
                      :user.property/date {:logseq.property/type :date
                                           :db/cardinality :db.cardinality/one
                                           :block/title "date"}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "num block"
                     :build/properties {:user.property/num 2}}
                    {:block/title "date block"
                     :build/properties {:user.property/date [:build/page {:build/journal 20250203}]}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        page (db-test/find-page-by-title @conn "page1")
        conn2 (db-test/create-conn)
        {:keys [init-tx block-props-tx] :as _txs}
        (->> (sqlite-export/build-page-export @conn (:db/id page))
             (sqlite-export/build-import @conn2 {}))
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! conn2 init-tx)
        _ (d/transact! conn2 block-props-tx)
        page2 (db-test/find-page-by-title @conn2 "page1")
        full-imported-page (sqlite-export/build-page-export @conn2 (:db/id page2))]

    (is (= (:properties original-data) (:properties full-imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes full-imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks full-imported-page))
        "Page's blocks are imported")))