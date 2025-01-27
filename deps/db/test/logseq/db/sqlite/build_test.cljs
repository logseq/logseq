(ns logseq.db.sqlite.build-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]))

(deftest build-tags
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/tags [:Person]}
                      {:block/title "some task" :build/tags [:logseq.class/Task]}]}
            {:page {:block/title "Jayson Tatum" :build/tags [:Person]}}])]
    (is (= [:user.class/Person]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "Jrue Holiday"))))
        "Person class is created and correctly associated to a block")

    (is (contains?
         (set (map :db/ident (:block/tags (db-test/find-page-by-title @conn "Jayson Tatum"))))
         :user.class/Person)
        "Person class is created and correctly associated to a page")

    (is (= [:logseq.class/Task]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "some task"))))
        "Built-in class is associatedly correctly")))

(deftest build-properties-user
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/properties {:description "Clutch defense"}}]}
            {:page {:block/title "Jayson Tatum" :build/properties {:description "Awesome selfless basketball"}}}])]
    (is (= "Clutch defense"
           (->> (db-test/find-block-by-content @conn "Jrue Holiday")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a block")

    (is (= "Awesome selfless basketball"
           (->> (db-test/find-page-by-title @conn "Jayson Tatum")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a page")))

(deftest build-properties-built-in
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "some todo"
                       :build/properties {:logseq.task/status :logseq.task/status.doing}}
                      {:block/title "some slide"
                       :build/properties {:logseq.property/background-image "https://placekitten.com/200/300"}}]}])]
    (is (= :logseq.task/status.doing
           (->> (db-test/find-block-by-content @conn "some todo")
                :logseq.task/status
                :db/ident))
        "built-in property with closed value is created and correctly associated to a block")

    (is (= "https://placekitten.com/200/300"
           (->> (db-test/find-block-by-content @conn "some slide")
                :logseq.property/background-image
                db-property/property-value-content))
        "built-in :default property is created and correctly associated to a block")))
