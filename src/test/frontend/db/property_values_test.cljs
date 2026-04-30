(ns frontend.db.property-values-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.test.helper :as test-helper]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(def repo test-helper/test-db)

(defn start-and-destroy-db
  [f]
  (test-helper/start-and-destroy-db f))

(use-fixtures :each start-and-destroy-db)

(deftest get-property-values-filters-recycled-ref-values-test
  (let [property-ident :block/tags
        active-title "Active ref value"
        recycled-title "Recycled ref value"]
    (d/transact! (db/get-db repo false)
                 [[:db/add -2 :block/title active-title]
                  [:db/add -3 :block/title recycled-title]
                  [:db/add -3 :logseq.property/deleted-at 1]
                  [:db/add -10 property-ident -2]
                  [:db/add -11 property-ident -3]])
    (let [result (db-view/get-property-values @(db/get-db repo false) property-ident {})]
      (is (contains? (set (map :label result)) active-title))
      (is (not (contains? (set (map :label result)) recycled-title))))))

(deftest property-closed-values-hide-recycled-values-test
  (d/transact! (db/get-db repo false)
               [{:db/id -1 :db/ident :user.property/closed-values-visibility}
                {:db/id -2
                 :block/title "Visible closed value"
                 :block/order "a"
                 :block/closed-value-property -1}
                {:db/id -3
                 :block/title "Recycled closed value"
                 :block/order "b"
                 :block/closed-value-property -1
                 :logseq.property/deleted-at 1}])
  (let [db @(db/get-db repo false)
        property (d/entity db :user.property/closed-values-visibility)
        values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
    (is (= ["Visible closed value"] (map :block/title values)))))

(deftest class-add-property-keeps-scoped-choices-unchanged-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:t1 {:build/class-properties [:priority]}
                         :t2 {}}
               :properties {:priority {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "b1" :build/tags [:t1]}
                          {:block/title "b2" :build/tags [:t2]}]}]})
        t1 (:db/id (d/entity @conn :user.class/t1))
        _ (outliner-property/upsert-closed-value! conn :user.property/priority
                                                  {:value "P1"
                                                   :scoped-class-id t1})
        property-before (d/entity @conn :user.property/priority)
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")]
    (is (= ["P1"]
           (map db-property/closed-value-content
                (db-property/scoped-closed-values property-before b1))))
    (is (empty? (db-property/scoped-closed-values property-before b2)))
    (outliner-property/class-add-property! conn :user.class/t2 :user.property/priority)
    (let [property-after (d/entity @conn :user.property/priority)]
      (is (empty? (db-property/scoped-closed-values property-after b2)))
      (is (= [t1]
             (->> (:property/closed-values property-after)
                  (mapcat :logseq.property/choice-classes)
                  (map :db/id)
                  distinct
                  sort))))))
