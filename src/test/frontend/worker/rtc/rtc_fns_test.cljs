(ns frontend.worker.rtc.rtc-fns-test
  (:require [clojure.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.handler.page :as page-handler]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.common.config :as common-config]
            [frontend.worker.state :as worker-state]
            [frontend.worker.rtc.const :as rtc-const]
            [logseq.db :as ldb]))


(deftest filter-remote-data-by-local-unpushed-ops-test
  (testing "case1"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :move
            :self uuid1
            :parents [uuid2]
            :left uuid2
            :content "content-str"}}
          unpushed-ops
          [["update" {:block-uuid uuid1
                      :updated-attrs {:content nil}
                      :epoch 1}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :move
               :self uuid1
               :parents [uuid2]
               :left uuid2}}
             r))))
  (testing "case2"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]
            :left uuid2
            :content "content-str"
            :created-at 123}}
          unpushed-ops
          [["update" {:block-uuid uuid1
                      :updated-attrs {:content nil}
                      :epoch 1}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :parents [uuid2]
               :left uuid2
               :created-at 123}}
             r))))
  (testing "case3"
    (let [[uuid1] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :remove
            :block-uuid uuid1}}
          unpushed-ops
          [["move" {:block-uuid uuid1 :epoch 1}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (empty? r)))))


(deftest gen-remote-ops-test
  (state/set-current-repo! test-helper/test-db)
  (test-helper/reset-test-db!)
  (let [conn (conn/get-db test-helper/test-db false)
        [uuid1 uuid2 uuid3 uuid4] (repeatedly random-uuid)
        opts {:persist-op? false
              :transact-opts {:repo test-helper/test-db
                              :conn conn}}]
    (page-handler/create! "gen-remote-ops-test" {:redirect? false :create-first-block? false :uuid uuid1})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      test-helper/test-db
      conn
      [{:block/uuid uuid2 :block/content "uuid2-block"}
       {:block/uuid uuid3 :block/content "uuid3-block"
        :block/left [:block/uuid uuid2]
        :block/parent [:block/uuid uuid1]}
       {:block/uuid uuid4 :block/content "uuid4-block"
        :block/left [:block/uuid uuid3]
        :block/parent [:block/uuid uuid1]}]
      (d/pull @conn '[*] [:block/name "gen-remote-ops-test"])
      {:sibling? true :keep-uuid? true}))

    (op-mem-layer/init-empty-ops-store! test-helper/test-db)
    (op-mem-layer/add-ops! test-helper/test-db [["move" {:block-uuid (str uuid2) :epoch 1}]
                                                ["move" {:block-uuid (str uuid4) :epoch 2}]
                                                ["move" {:block-uuid (str uuid3) :epoch 3}]
                                                ["update" {:block-uuid (str uuid4) :epoch 4}]])
    (let [_ (op-mem-layer/new-branch! test-helper/test-db)
          r1 (rtc-core/gen-block-uuid->remote-ops test-helper/test-db conn :n 1)
          _ (op-mem-layer/rollback! test-helper/test-db)
          r2 (rtc-core/gen-block-uuid->remote-ops test-helper/test-db conn :n 2)]
      (is (= {uuid2 [:move]}
             (update-vals r1 keys)))
      (is (= {uuid2 [:move]
              uuid3 [:move]
              uuid4 [:move :update]}
             (update-vals r2 keys))))
    (op-mem-layer/remove-ops-store! test-helper/test-db))
  (state/set-current-repo! nil)
  (test-helper/destroy-test-db!))


(deftest apply-remote-move-ops-test1
  (state/set-current-repo! test-helper/test-db)
  (test-helper/reset-test-db!)
  (let [page-name "apply-remote-move-ops-test1"
        conn (conn/get-db test-helper/test-db false)
        repo test-helper/test-db
        opts {:persist-op? false
              :transact-opts {:repo test-helper/test-db
                              :conn conn}}
        [page-uuid
         uuid1-client uuid2-client
         uuid1-remote] (repeatedly random-uuid)
        data-from-ws {:req-id "req-id"
                      :t 1
                      :t-before 0
                      :affected-blocks
                      {uuid1-remote {:op :move
                                     :self uuid1-remote
                                     :parents [page-uuid]
                                     :left page-uuid
                                     :content "uuid1-remote"}}}
        move-ops (#'rtc-core/move-ops-map->sorted-move-ops
                  (:move-ops-map
                   (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
    (is (rtc-const/data-from-ws-validator data-from-ws))
    (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      test-helper/test-db
      conn
      [{:block/uuid uuid1-client :block/content "uuid1-client"
        :block/left [:block/uuid page-uuid]
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/content "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page-uuid]}]
      (d/pull @conn '[*] [:block/name page-name])
      {:sibling? true :keep-uuid? true}))
    (rtc-core/apply-remote-move-ops repo conn
                                    (common-config/get-date-formatter (worker-state/get-config test-helper/test-db))
                                    move-ops)
    (let [sorted-page-blocks (ldb/sort-by-left
                              (ldb/get-page-blocks @conn page-name {})
                              (d/entity @conn [:block/uuid page-uuid]))]
      (is (= [uuid1-remote uuid1-client uuid2-client] (map :block/uuid sorted-page-blocks))))))
