(ns frontend.worker.rtc.gen-client-op-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.fixture :as r.fixture]
            [frontend.worker.rtc.gen-client-op :as subject]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.batch-tx :as batch-tx]
            [logseq.outliner.core :as outliner-core]
            [meander.epsilon :as me]))

(t/use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  r.fixture/listen-test-db-to-gen-rtc-ops-fixture)

(defn- tx-data=>e->a->add?->v->t
  [tx-data]
  (let [datom-vec-coll (map vec tx-data)
        id->same-entity-datoms (group-by first datom-vec-coll)]
    (update-vals id->same-entity-datoms #'subject/entity-datoms=>a->add?->v->t)))

(deftest ^:large-vars/cleanup-todo entity-datoms=>ops-test
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

  (testing "create page block"
    (let [conn (db-test/create-conn)
          block-uuid (random-uuid)
          tx-data [[:db/add 1000000 :block/uuid block-uuid]
                   [:db/add 1000000 :block/name "page-name"]
                   [:db/add 1000000 :block/title "Page Title"]
                   [:db/add 1000000 :block/created-at 1716882111476]
                   [:db/add 1000000 :block/updated-at 1716882111476]]
          {:keys [db-before db-after tx-data]} (d/transact! conn tx-data)
          ops (#'subject/entity-datoms=>ops db-before db-after
                                            (tx-data=>e->a->add?->v->t tx-data)
                                            nil
                                            (map vec tx-data))]
      (is (= [[:update-page {:block-uuid block-uuid}]
              [:add {:block-uuid block-uuid
                     :av-coll
                     (set [[:block/updated-at "[\"~#'\",1716882111476]"]
                           [:block/created-at "[\"~#'\",1716882111476]"]
                           [:block/title "[\"~#'\",\"Page Title\"]"]])}]]
             (map (fn [[op-type _t op-value]]
                    [op-type (cond-> op-value
                               (:av-coll op-value)
                               (assoc :av-coll (set (map #(take 2 %) (:av-coll op-value)))))])
                  ops)))))

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
           [[:update-page {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"}]
            [:add {:block-uuid #uuid "66558abf-6512-469d-9e83-8f1ba0be9305"
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
                   [:db/add 1000000 :logseq.property.class/extends :logseq.class/Root 536870954]
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
            [:add {:block-uuid #uuid "66856a29-6eb3-4122-af97-8580a853c6a6",
                   :av-coll
                   (set
                    [[:block/updated-at "[\"~#'\",1720019497643]"]
                     [:block/created-at "[\"~#'\",1720019497643]"]
                     [:block/tags #uuid "00000002-5389-0208-3000-000000000000"]
                     [:block/title "[\"~#'\",\"zzz\"]"]
                     [:logseq.property.class/extends #uuid "00000002-2737-8382-7000-000000000000"]
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
        (worker-page/create! conn "TEST-PAGE" {:uuid page-uuid})
        (is (some? (d/pull @conn '[*] [:block/uuid page-uuid])))
        (is (= {page-uuid #{:add :update-page}}
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo)))))
      (testing "add blocks to this page"
        (let [target-entity (d/entity @conn [:block/uuid page-uuid])]
          (batch-tx/with-batch-tx-mode conn
            {:persist-op? true}
            (outliner-core/insert-blocks! conn [{:block/uuid block-uuid1
                                                 :block/title "block1"}
                                                {:block/uuid block-uuid2
                                                 :block/title "block2"}]
                                          target-entity
                                          {:sibling? false :keep-uuid? true}))
          (is (=
               {block-uuid1 #{:add}
                block-uuid2 #{:add}}
               (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo))))))

      (testing "delete a block"
        (batch-tx/with-batch-tx-mode conn
          {:persist-op? true}
          (outliner-core/delete-blocks! conn [(d/entity @conn [:block/uuid block-uuid1])] {}))

        (is (=
             {block-uuid1 #{:remove}}
             (ops-coll=>block-uuid->op-types (client-op/get&remove-all-block-ops repo))))))))

(deftest generate-rtc-ops-from-property-entity-test
  (let [repo (state/get-current-repo)
        db (conn/get-db repo true)
        ent (d/entity db :logseq.property.view/feature-type)
        av-coll-attrs #{:logseq.property/type :logseq.property/built-in?
                        :logseq.property/public? :logseq.property/hide?
                        :block/tags :block/title :db/cardinality}]
    #_{:clj-kondo/ignore [:unresolved-symbol :invalid-arity]}
    (is (->> (me/find (subject/generate-rtc-ops-from-property-entities [ent])
                      ([:update-page . _ ...] [:add _ {:block-uuid ?block-uuid :av-coll ([!av-coll-attrs . _ ...] ...)}])
                      !av-coll-attrs)
             set
             (set/difference av-coll-attrs)
             empty?))))

(deftest generate-rtc-ops-from-class-entity-test
  (let [repo (state/get-current-repo)
        db (conn/get-db repo true)
        ent (d/entity db :logseq.class/Template)
        av-coll-attrs #{:logseq.property.class/properties :logseq.property/built-in? :logseq.property.class/extends
                        :block/tags :block/title}]
    #_{:clj-kondo/ignore [:unresolved-symbol :invalid-arity]}
    (is (->> (me/find (subject/generate-rtc-ops-from-class-entities [ent])
                      ([:update-page . _ ...] [:add _ {:block-uuid ?block-uuid :av-coll ([!av-coll-attrs . _ ...] ...)}])
                      !av-coll-attrs)
             set
             (set/difference av-coll-attrs)
             empty?))))

(deftest remove-conflict-same-block-datoms-test
  (testing "remove conflict entity-datoms for same-block"
    (let [block-uuid #uuid "693ec519-e73e-4f2c-b517-7e75ca2c64da"
          datoms-182 [[182 :logseq.property/created-by-ref 161 536870976 false]
                      [182 :block/created-at 1765721369994 536870976 false]
                      [182 :block/parent 162 536870976 false]
                      [182 :block/order "aF" 536870976 false]
                      [182 :block/tx-id 536870972 536870976 false]
                      [182 :block/page 162 536870976 false]
                      [182 :block/uuid block-uuid 536870976 false]
                      [182 :block/title "" 536870976 false]
                      [182 :block/updated-at 1765721369994 536870976 false]]
          datoms-185 [[185 :block/parent 162 536870976 true]
                      [185 :logseq.property/created-by-ref 161 536870976 true]
                      [185 :block/title "111" 536870976 true]
                      [185 :logseq.property.embedding/hnsw-label-updated-at 0 536870976 true]
                      [185 :block/order "aG" 536870976 true]
                      [185 :block/page 162 536870976 true]
                      [185 :block/created-at 1765721370449 536870976 true]
                      [185 :block/updated-at 1765721370449 536870976 true]
                      [185 :block/uuid block-uuid 536870976 true]
                      [185 :block/tx-id 536870976 536870977 true]]
          same-entity-datoms-coll [datoms-182 datoms-185]
          result (subject/remove-conflict-same-block-datoms same-entity-datoms-coll)]
      (is (= 1 (count result)))
      (is (= 185 (nth (ffirst result) 0)))
      (is (= datoms-185 (first result)))))

  (testing "remove conflict entity-datoms should preserve order"
    (let [block-uuid1 #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          block-uuid2 #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          datoms-1    [[100 :block/uuid block-uuid1 1 true]]
          datoms-2    [[101 :block/uuid block-uuid2 2 true]]
          datoms-3    [[102 :block/uuid block-uuid2 2 true]] ;; Conflict with datoms-2, wins (higher ID)
          same-entity-datoms-coll [datoms-1 datoms-2 datoms-3]
          result      (subject/remove-conflict-same-block-datoms same-entity-datoms-coll)]
      (is (= 2 (count result)))
      (is (= datoms-1 (first result)))
      (is (= datoms-3 (second result)))))

  (testing "remove conflict entity-datoms should prefer add over retract"
    (let [block-uuid1 #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          datoms-1    [[100 :block/uuid block-uuid1 1 true]]
          datoms-2    [[101 :block/uuid block-uuid1 1 false]]
          same-entity-datoms-coll [datoms-1 datoms-2]
          result      (subject/remove-conflict-same-block-datoms same-entity-datoms-coll)]
      (is (= 1 (count result)))
      (is (= datoms-1 (first result))))))
