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
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/tags [:Person]}]}
            {:page {:block/title "Jayson Tatum" :build/tags [:Person]}}])]
    (is (= {:block/tags [{:block/title "Person", :block/type "class"}]}
           (first (d/q '[:find [(pull ?b [{:block/tags [:block/title :block/type]}]) ...]
                         :where [?b :block/title "Jrue Holiday"]]
                       @conn)))
        "Person class is created and correctly associated to a block")

    (is (= {:block/tags [{:block/title "Person", :block/type "class"}]}
           (first (d/q '[:find [(pull ?b [{:block/tags [:block/title :block/type]}]) ...]
                         :where [?b :block/title "Jayson Tatum"]]
                       @conn)))
        "Person class is created and correctly associated to a page")))

(deftest build-properties-user
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/properties {:description "Clutch defense"}}]}
            {:page {:block/title "Jayson Tatum" :build/properties {:description "Awesome selfless basketball"}}}])]
    (is (= "Clutch defense"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                       :where [?b :block/title "Jrue Holiday"]])
                first
                :user.property/description
                (db-property/ref->property-value-contents @conn)))
        "description property is created and correctly associated to a block")

    (is (= "Awesome selfless basketball"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                       :where [?b :block/title "Jayson Tatum"]])
                first
                :user.property/description
                (db-property/ref->property-value-contents @conn)))
        "description property is created and correctly associated to a page")))

(deftest build-properties-built-in
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "some todo"
                       :build/properties {:logseq.task/status :logseq.task/status.doing}}
                      {:block/title "some slide"
                       :build/properties {:logseq.property/background-image "https://placekitten.com/200/300"}}]}])]
    (is (= "Doing"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                       :where [?b :block/title "some todo"]])
                first
                :logseq.task/status
                (db-property/ref->property-value-contents @conn)))
        "built-in property with closed value is created and correctly associated to a block")

    (is (= "https://placekitten.com/200/300"
           (->> @conn
                (d/q '[:find [(pull ?b [*]) ...]
                       :where [?b :block/title "some slide"]])
                first
                :logseq.property/background-image
                (db-property/ref->property-value-contents @conn)))
        "built-in :default property is created and correctly associated to a block")))
