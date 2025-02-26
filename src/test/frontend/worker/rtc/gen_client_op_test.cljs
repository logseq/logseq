(ns frontend.worker.rtc.gen-client-op-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.fixture :as r.fixture]
            [frontend.worker.rtc.gen-client-op :as subject]
            [frontend.worker.state :as worker-state]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.batch-tx :as batch-tx]
            [logseq.outliner.core :as outliner-core]))

(t/use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture
  r.fixture/listen-test-db-to-gen-rtc-ops-fixture)

(defn- tx-data=>e->a->add?->v->t
  [tx-data]
  (let [datom-vec-coll (map vec tx-data)
        id->same-entity-datoms (group-by first datom-vec-coll)]
    (update-vals id->same-entity-datoms #'subject/entity-datoms=>a->add?->v->t)))

(deftest entity-datoms=>ops-test
  (testing "remove whiteboard page-block"
    (let [conn (db-test/create-conn)
          block-uuid (random-uuid)
          _create-whiteboard-page-block
          (d/transact! conn [{:block/uuid block-uuid
                              :block/tags :logseq.class/Whiteboard
                              :block/name "block-name"
                              :block/title "BLOCK-NAME"}])
          remove-whiteboard-page-block
          (d/transact! conn [[:db/retractEntity [:block/uuid block-uuid]]])
          r (#'subject/entity-datoms=>ops (:db-before remove-whiteboard-page-block)
                                          (:db-after remove-whiteboard-page-block)
                                          (tx-data=>e->a->add?->v->t (:tx-data remove-whiteboard-page-block))
                                          nil
                                          (map vec (:tx-data remove-whiteboard-page-block)))]
      (is (= [[:remove-page {:block-uuid block-uuid}]]
             (map (fn [[op-type _t op-value]] [op-type op-value]) r)))))

  (testing "update-schema op"
    (let [conn (db-test/create-conn)
          tx-data [[:db/add 1000000 :db/index true]
                   [:db/add 1000000 :block/uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"]
                   [:db/add 1000000 :db/valueType :db.type/ref]
                   [:db/add 1000000 :block/updated-at 1716882111476]
                   [:db/add 1000000 :block/created-at 1716882111476]
                   [:db/add 1000000 :logseq.property/type :number]
                   [:db/add 1000000 :db/cardinality :db.cardinality/one]
                   [:db/add 1000000 :db/ident :user.property/qqq]
                   [:db/add 1000000 :block/tags :logseq.class/Property]
                   [:db/add 1000000 :block/order "b0T"]
                   [:db/add 1000000 :block/name "qqq"]
                   [:db/add 1000000 :block/title "qqq"]
                   [:db/add 1000000 :logseq.property/ignored-attr-x "111"]]
          {:keys [db-before db-after tx-data]} (d/transact! conn tx-data)
          ops (#'subject/entity-datoms=>ops db-before db-after
                                            (tx-data=>e->a->add?->v->t tx-data)
                                            #{:logseq.property/ignored-attr-x}
                                            (map vec tx-data))]
      (is (=
           [[:move {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"}]
            [:update-page {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"}]
            [:update {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"
                      :av-coll
                      [[:db/index "[\"~#'\",true]"]
                       [:logseq.property/type "[\"~#'\",\"~:number\"]"]
                       [:db/valueType "[\"~#'\",\"~:db.type/ref\"]"]
                       [:block/updated-at "[\"~#'\",1716882111476]"]
                       [:block/created-at "[\"~#'\",1716882111476]"]
                       [:block/tags #uuid "00000002-1038-7670-4800-000000000000"]
                       [:block/title "[\"~#'\",\"qqq\"]"]
                       [:db/cardinality "[\"~#'\",\"~:db.cardinality/one\"]"]
                       ;; [:db/ident "[\"~#'\",\"~:user.property/qqq\"]"]
                       ]}]]
           (map (fn [[op-type _t op-value]]
                  [op-type (cond-> op-value
                             (:av-coll op-value)
                             (assoc :av-coll (map #(take 2 %) (:av-coll op-value))))])
                ops)))))

  (testing "create user-class"
    (let [conn (db-test/create-conn)
          tx-data [[:db/add 1000000 :block/uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6" 536870954]
                   [:db/add 1000000 :block/updated-at 1720019497643 536870954]
                   [:db/add 1000000 :logseq.property/parent :logseq.class/Root 536870954]
                   [:db/add 1000000 :block/created-at 1720019497643 536870954]
                   [:db/add 1000000 :db/ident :user.class/zzz 536870954]
                   [:db/add 1000000 :block/tags :logseq.class/Tag 536870954]
                   [:db/add 1000000 :block/name "zzz" 536870954]
                   [:db/add 1000000 :block/title "zzz" 536870954]]
          {:keys [db-before db-after tx-data]} (d/transact! conn tx-data)
          ops (#'subject/entity-datoms=>ops db-before db-after
                                            (tx-data=>e->a->add?->v->t tx-data)
                                            nil
                                            (map vec tx-data))]
      (is (=
           [[:update-page {:block-uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6"}]
            [:update {:block-uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6",
                      :av-coll
                      (set
                       [[:block/updated-at "[\"~#'\",1720019497643]"]
                        [:block/created-at "[\"~#'\",1720019497643]"]
                        [:block/tags #uuid "00000002-5389-0208-3000-000000000000"]
                        [:block/title "[\"~#'\",\"zzz\"]"]
                        [:logseq.property/parent #uuid "00000002-2737-8382-7000-000000000000"]
                       ;;1. shouldn't have :db/ident, :db/ident is special, will be handled later
                        ])}]]
           (map (fn [[op-type _t op-value]]
                  [op-type (cond-> op-value
                             (:av-coll op-value)
                             (assoc :av-coll (set (map #(take 2 %) (:av-coll op-value)))))])
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
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo)))))
      (testing "add blocks to this page"
        (let [target-entity (d/entity @conn [:block/uuid page-uuid])]
          (batch-tx/with-batch-tx-mode conn
            {:persist-op? true}
            (outliner-core/insert-blocks! repo conn [{:block/uuid block-uuid1
                                                      :block/title "block1"}
                                                     {:block/uuid block-uuid2
                                                      :block/title "block2"}]
                                          target-entity
                                          {:sibling? false :keep-uuid? true}))
          (is (=
               {block-uuid1 #{:move :update}
                block-uuid2 #{:move :update}}
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo))))))

      (testing "delete a block"
        (batch-tx/with-batch-tx-mode conn
          {:persist-op? true}
          (outliner-core/delete-blocks! repo conn nil [(d/entity @conn [:block/uuid block-uuid1])] {}))

        (is (=
             {block-uuid1 #{:remove}}
             (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo))))))))

(deftest generate-rtc-ops-from-property-entity-test
  (let [repo (state/get-current-repo)
        db (conn/get-db repo true)
        ent (d/entity db :logseq.property.view/feature-type)]
    (is (= #{:move :update-page :update}
           (set (map first (subject/generate-rtc-ops-from-property-entities [ent])))))))
