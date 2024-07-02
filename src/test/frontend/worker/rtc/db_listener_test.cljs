(ns frontend.worker.rtc.db-listener-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.rtc.db-listener :as subject]
            [logseq.db.frontend.schema :as db-schema]))

(def empty-db (d/empty-db db-schema/schema-for-db-based-graph))

(defn- tx-data=>e->a->add?->v->t
  [tx-data]
  (let [datom-vec-coll (map vec tx-data)
        id->same-entity-datoms (group-by first datom-vec-coll)]
    (update-vals id->same-entity-datoms #'worker-db-listener/entity-datoms=>a->add?->v->t)))


(deftest entity-datoms=>ops-test
  (testing "remove whiteboard page-block"
    (let [conn (d/conn-from-db empty-db)
          block-uuid (random-uuid)
          _create-whiteboard-page-block
          (d/transact! conn [{:block/uuid block-uuid
                              :block/type "whiteboard"
                              :block/name "block-name"
                              :block/original-name "BLOCK-NAME"}])
          remove-whiteboard-page-block
          (d/transact! conn [[:db/retractEntity [:block/uuid block-uuid]]])
          r (#'subject/entity-datoms=>ops (:db-before remove-whiteboard-page-block)
                                          (:db-after remove-whiteboard-page-block)
                                          (tx-data=>e->a->add?->v->t (:tx-data remove-whiteboard-page-block))
                                          (map vec (:tx-data remove-whiteboard-page-block)))]
      (is (= [[:remove-page {:block-uuid block-uuid}]]
             (map (fn [[op-type _t op-value]] [op-type op-value]) r)))))

  (testing "update-schema op"
    (let [conn (d/conn-from-db empty-db)
          tx-data [[:db/add 69 :db/index true]
                   [:db/add 69 :block/uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"]
                   [:db/add 69 :db/valueType :db.type/ref]
                   [:db/add 69 :block/updated-at 1716882111476]
                   [:db/add 69 :block/created-at 1716882111476]
                   [:db/add 69 :block/schema {:type :number}]
                   [:db/add 69 :block/format :markdown]
                   [:db/add 69 :db/cardinality :db.cardinality/one]
                   [:db/add 69 :db/ident :user.property/qqq]
                   [:db/add 69 :block/type "property"]
                   [:db/add 69 :block/order "b0T"]
                   [:db/add 69 :block/name "qqq"]
                   [:db/add 69 :block/original-name "qqq"]]
          {:keys [db-before db-after tx-data]} (d/transact! conn tx-data)
          ops (#'subject/entity-datoms=>ops db-before db-after
                                            (tx-data=>e->a->add?->v->t tx-data)
                                            (map vec tx-data))]
      (is (=
           [[:move {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"}]
            [:update-page {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"}]
            [:update {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"
                      :av-coll
                      [[:db/index "[\"~#'\",true]"]
                       [:db/valueType "[\"~#'\",\"~:db.type/ref\"]"]
                       [:block/updated-at "[\"~#'\",1716882111476]"]
                       [:block/created-at "[\"~#'\",1716882111476]"]
                       [:block/schema "[\"^ \",\"~:type\",\"~:number\"]"]
                       [:db/cardinality "[\"~#'\",\"~:db.cardinality/one\"]"]
                       [:db/ident "[\"~#'\",\"~:user.property/qqq\"]"]
                       [:block/type "[\"~#'\",\"property\"]"]]}]]
           (map (fn [[op-type _t op-value]]
                  [op-type (cond-> op-value
                             (:av-coll op-value)
                             (assoc :av-coll (map #(take 2 %) (:av-coll op-value))))])
                ops))))))
