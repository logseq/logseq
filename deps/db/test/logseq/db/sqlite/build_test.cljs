(ns logseq.db.sqlite.build-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.frontend.property :as db-property]))

(deftest build-tags
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/original-name "page1"}
             :blocks [{:block/content "Jrue Holiday" :build/tags [:Person]}]}
            {:page {:block/original-name "Jayson Tatum" :build/tags [:Person]}}])]
    (is (= {:block/tags [{:block/original-name "Person", :block/type ["class"]}]}
           (first (d/q '[:find [(pull ?b [{:block/tags [:block/original-name :block/type]}]) ...]
                         :where [?b :block/content "Jrue Holiday"]]
                       @conn)))
        "Person class is created and correctly associated to a block")

    (is (= {:block/tags [{:block/original-name "Person", :block/type ["class"]}]}
           (first (d/q '[:find [(pull ?b [{:block/tags [:block/original-name :block/type]}]) ...]
                         :where [?b :block/original-name "Jayson Tatum"]]
                       @conn)))
        "Person class is created and correctly associated to a page")))
        
(deftest build-properties
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/original-name "page1"}
             :blocks [{:block/content "Jrue Holiday" :build/properties {:description "Clutch defense"}}]}
            {:page {:block/original-name "Jayson Tatum" :build/properties {:description "Awesome selfless basketball"}}}])]
    (is (= "Clutch defense"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                          :where [?b :block/content "Jrue Holiday"]])
                first
                :user.property/description
                (db-property/get-property-value-name-from-ref @conn)))
        "description property is created and correctly associated to a block")

    (is (= "Awesome selfless basketball"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                           :where [?b :block/original-name "Jayson Tatum"]])
                first
                :user.property/description
                (db-property/get-property-value-name-from-ref @conn)))
        "description property is created and correctly associated to a page")))