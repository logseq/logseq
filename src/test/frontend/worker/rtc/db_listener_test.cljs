(ns frontend.worker.rtc.db-listener-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.db-listener :as subject]
            [frontend.worker.rtc.fixture :as r.fixture]
            [frontend.worker.state :as worker-state]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.outliner.batch-tx :as batch-tx]
            [logseq.outliner.core :as outliner-core]))

(t/use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture
  r.fixture/listen-test-db-to-gen-rtc-ops-fixture)

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
                              :block/title "BLOCK-NAME"}])
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
                   [:db/add 69 :block/title "qqq"]]
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
                       [:block/title "[\"~#'\",\"qqq\"]"]
                       [:db/cardinality "[\"~#'\",\"~:db.cardinality/one\"]"]
                       ;; [:db/ident "[\"~#'\",\"~:user.property/qqq\"]"]
                       [:block/type "[\"~#'\",\"property\"]"]]}]]
           (map (fn [[op-type _t op-value]]
                  [op-type (cond-> op-value
                             (:av-coll op-value)
                             (assoc :av-coll (map #(take 2 %) (:av-coll op-value))))])
                ops)))))

  (testing "create user-class"
    (let [conn (d/conn-from-db empty-db)
          tx-data [[:db/add 62 :block/uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6" 536870954]
                   [:db/add 62 :block/updated-at 1720019497643 536870954]
                   [:db/add 62 :class/parent 4 536870954]
                   [:db/add 62 :block/created-at 1720019497643 536870954]
                   [:db/add 62 :block/format :markdown 536870954]
                   [:db/add 62 :db/ident :user.class/zzz 536870954]
                   [:db/add 62 :block/type "class" 536870954]
                   [:db/add 62 :block/name "zzz" 536870954]
                   [:db/add 62 :block/title "zzz" 536870954]]
          {:keys [db-before db-after tx-data]} (d/transact! conn tx-data)
          ops (#'subject/entity-datoms=>ops db-before db-after
                                            (tx-data=>e->a->add?->v->t tx-data)
                                            (map vec tx-data))]
      (is (=
           [[:update-page {:block-uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6"}]
            [:update {:block-uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6",
                      :av-coll
                      [[:block/updated-at "[\"~#'\",1720019497643]"]
                       [:block/created-at "[\"~#'\",1720019497643]"]
                       [:block/title "[\"~#'\",\"zzz\"]"]
                       [:block/type "[\"~#'\",\"class\"]"]
                       ;;1. no :class/parent, because db/id 4 block doesn't exist in empty-db
                       ;;2. shouldn't have :db/ident, :db/ident is special, will be handled later
                       ]}]]
           (map (fn [[op-type _t op-value]]
                  [op-type (cond-> op-value
                             (:av-coll op-value)
                             (assoc :av-coll (map #(take 2 %) (:av-coll op-value))))])
                ops))))))

(deftest listen-db-changes-and-validate-generated-rtc-ops
  (letfn [(ops-coll=>block-uuid->op-types [ops-coll]
            (into {}
                  (map (fn [m]
                         [(:block/uuid m) (set (keys (dissoc m :block/uuid)))]))
                  ops-coll))]
    (let [repo (state/get-current-repo)
          conn (conn/get-db repo false)
          [page-uuid block-uuid1 block-uuid2] (repeatedly random-uuid)]
      (testing "add page"
        (worker-page/create! repo conn (worker-state/get-config repo)
                             "TEST-PAGE"
                             {:uuid page-uuid
                              :create-first-block? false})
        (is (some? (d/pull @conn '[*] [:block/uuid page-uuid])))
        (is (= {page-uuid #{:update-page :update}}
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-ops repo)))))
      (testing "add blocks to this page"
        (let [target-entity (d/entity @conn [:block/uuid page-uuid])]
          (batch-tx/with-batch-tx-mode conn
            {:persist-op? true}
            (outliner-core/insert-blocks! repo conn [{:block/uuid block-uuid1
                                                      :block/title "block1"
                                                      :block/format :markdown}
                                                     {:block/uuid block-uuid2
                                                      :block/title "block2"
                                                      :block/format :markdown}]
                                          target-entity
                                          {:sibling? false :keep-uuid? true}))
          (is (=
               {block-uuid1 #{:move :update}
                block-uuid2 #{:move :update}}
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-ops repo))))))

      (testing "delete a block"
        (batch-tx/with-batch-tx-mode conn
          {:persist-op? true}
          (outliner-core/delete-blocks! repo conn nil [(d/entity @conn [:block/uuid block-uuid1])] {}))

        (is (=
             {block-uuid1 #{:remove}}
             (ops-coll=>block-uuid->op-types (client-op/get&remove-all-ops repo))))))))
