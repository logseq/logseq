(ns frontend.worker.plain-value-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.plain-value :as plain-value]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- property-value-db
  ([property-type target]
   (property-value-db property-type target {}))
  ([property-type target value-attrs]
   (let [conn (d/create-conn db-schema/schema)
         target-uuid #uuid "11111111-1111-1111-1111-111111111111"
         value-uuid #uuid "22222222-2222-2222-2222-222222222222"
         host-uuid #uuid "33333333-3333-3333-3333-333333333333"]
     (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
     (d/transact! conn [{:db/id -1
                         :db/ident :user.property/related
                         :block/title "Related"
                         :logseq.property/type property-type
                         :db/valueType :db.type/ref
                         :db/cardinality :db.cardinality/one
                         :block/tags :logseq.class/Property}
                        (merge {:db/id -2
                                :block/uuid target-uuid
                                :block/title "Target"}
                               target)
                        (merge {:db/id -3
                                :block/uuid value-uuid
                                :block/title (str target-uuid)
                                :logseq.property/created-from-property -1
                                :block/parent -1
                                :block/page -1}
                               value-attrs)
                        {:db/id -4
                         :block/uuid host-uuid
                         :block/title "Host"
                         :block/name "host"
                         :block/tags :logseq.class/Page
                         :user.property/related -3}])
     [@conn (d/entity @conn [:block/uuid host-uuid]) target-uuid value-uuid])))

(deftest node-property-values-resolve-their-target-entity
  (testing "Page values are returned as the page, not the property-value wrapper"
    (let [[db host target-uuid _value-uuid]
          (property-value-db :node {:block/name "target"
                                    :block/tags :logseq.class/Page})
          value (:user.property/related (plain-value/entity-forward-map db host {}))]
      (is (= target-uuid (:block/uuid value)))
      (is (= "Target" (:block/title value)))
      (is (= "target" (:block/name value)))))
  (testing "Block values resolve through the same node-property path"
    (let [[db host target-uuid _value-uuid]
          (property-value-db :node {})
          value (:user.property/related (plain-value/entity-forward-map db host {}))]
      (is (= target-uuid (:block/uuid value)))
      (is (= "Target" (:block/title value))))))

(deftest legacy-node-property-values-keep-their-value-entity
  (let [target-title "https://logseq.io/p/nx4mc_ggev"
        [db host _target-uuid value-uuid]
        (property-value-db :node {:block/title target-title
                                  :block/name target-title
                                  :block/tags :logseq.class/Page}
                           {:block/title target-title})
        value (:user.property/related (plain-value/entity-forward-map db host {}))]
    (is (= value-uuid (:block/uuid value)))
    (is (= target-title (:block/title value)))))

(deftest direct-node-references-keep-their-target-entity
  (let [[db _host target-uuid _value-uuid] (property-value-db :node {})
        property-id (d/entid db :user.property/related)
        target-id (:db/id (d/entity db [:block/uuid target-uuid]))
        value (plain-value/attribute-value->plain db property-id target-id)]
    (is (= target-uuid (:block/uuid value)))
    (is (= "Target" (:block/title value)))))

(deftest property-value-summaries-keep-scalar-values
  (doseq [scalar-value [1 0 false]]
    (let [[db _host _target-uuid value-uuid]
          (property-value-db :number {} {:logseq.property/value scalar-value})
          property-id (d/entid db :user.property/related)
          value-id (:db/id (d/entity db [:block/uuid value-uuid]))
          value (plain-value/attribute-value->plain db property-id value-id)]
      (is (= scalar-value (:logseq.property/value value))))))

(deftest non-node-property-values-keep-their-value-entity
  (let [[db host _target-uuid value-uuid]
        (property-value-db :default {})
        value (:user.property/related (plain-value/entity-forward-map db host {}))]
    (is (= value-uuid (:block/uuid value)))
    (is (= "11111111-1111-1111-1111-111111111111" (:block/title value)))))

(deftest entity-forward-map-excludes-requested-attributes
  (let [[db host _target-uuid _value-uuid] (property-value-db :default {})
        result (plain-value/entity-forward-map db host {:exclude-attrs #{:block/name
                                                                         :user.property/related}})]
    (is (not (contains? result :block/name)))
    (is (not (contains? result :user.property/related)))
    (is (= "Host" (:block/title result)))))

(deftest get-block-display-properties-use-resolved-node-values
  (let [[db host target-uuid _value-uuid]
        (property-value-db :node {:block/name "target"
                                  :block/tags :logseq.class/Page})
        result (#'db-core/get-block-and-children db (:db/id host) {:children? false})
        value (get-in result [:block :block/properties :user.property/related])]
    (is (= target-uuid (:block/uuid value)))
    (is (= "Target" (:block/title value)))))
