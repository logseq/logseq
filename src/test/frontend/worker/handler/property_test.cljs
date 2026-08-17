(ns frontend.worker.handler.property-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(deftest property-node-selector-data-prepares-class-options-and-initial-choices
  (async done
    (let [conn (d/create-conn db-schema/schema)
          page-uuid #uuid "11111111-1111-1111-1111-111111111111"]
      (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
      (d/transact! conn [{:db/id -1
                          :db/ident :user.class/Topic
                          :block/title "Topic"
                          :block/name "topic"
                          :block/tags :logseq.class/Tag
                          :logseq.property.class/extends :logseq.class/Tag}
                         {:block/title "Page A"
                          :block/name "page-a"
                          :block/uuid page-uuid
                          :block/tags -1}])
      (->
       (p/let [topic-class (select-keys (d/entity @conn :user.class/Topic)
                                        [:db/id :db/ident :block/title])
               topic-class-id (:db/id topic-class)
               property {:db/ident :block/tags
                         :logseq.property/type :node
                         :logseq.property/classes [topic-class]}
               data (worker-property/property-node-selector-data
                     @conn
                     {:property property
                      :block {:db/id (:db/id (d/entity @conn [:block/uuid page-uuid]))}})]
         (is (some #(= :user.class/Topic (:db/ident %)) (:all-classes data)))
         (is (not-any? #(= :logseq.class/Root (:db/ident %)) (:class-options data)))
         (is (contains? (:structured-children-by-class-id data) topic-class-id))
         (is (some #(= :logseq.class/Tag (:db/ident %))
                   (get (:extends-by-class-id data) topic-class-id)))
         (is (= ["Page A"] (map :block/title (:initial-choices data)))))
       (p/catch
        (fn [error]
          (is false (str error))))
       (p/finally done)))))

(deftest display-properties-hides-hide-by-default-properties-on-nodes
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:keywords {:logseq.property/type :default
                                       :logseq.property/hide? true}
                            :author {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "Work"
                                          :build/properties {:keywords "clojure"
                                                             :author "Ada"}}}]})
        page (db-test/find-page-by-title @conn "Work")
        result (worker-property/display-properties @conn page {:page-title? true} false)
        full-ids (set (map :property-id (:full-properties result)))
        hidden-ids (set (map :property-id (:hidden-properties result)))]
    (testing "hide-by-default still hides the property on nodes that use it"
      (is (contains? hidden-ids :user.property/keywords))
      (is (not (contains? full-ids :user.property/keywords))))
    (testing "visible properties still appear on the node"
      (is (contains? full-ids :user.property/author))
      (is (not (contains? hidden-ids :user.property/author))))))

(deftest display-property-map-reflects-default-value-entity-updates
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/ident :user.property/color
                        :block/uuid (random-uuid)
                        :block/title "Color"
                        :block/tags :logseq.class/Property
                        :logseq.property/type :default}
                       {:db/ident :user.property/color.red
                        :block/uuid (random-uuid)
                        :block/title "Red"
                        :block/closed-value-property :user.property/color}
                       [:db/add :user.property/color
                        :logseq.property/default-value
                        :user.property/color.red]])
    (let [before (worker-property/display-property-map @conn :user.property/color)]
      (d/transact! conn [[:db/add :user.property/color.red :block/title "Crimson"]])
      (let [after (worker-property/display-property-map @conn :user.property/color)]
        (is (= "Red" (get-in before [:logseq.property/default-value :block/title])))
        (is (= "Crimson" (get-in after [:logseq.property/default-value :block/title])))))))
