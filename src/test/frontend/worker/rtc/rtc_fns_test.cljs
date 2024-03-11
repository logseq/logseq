(ns frontend.worker.rtc.rtc-fns-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))


(use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture)

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
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        [uuid1 uuid2 uuid3 uuid4] (repeatedly random-uuid)
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}]
    (page-handler/create! "gen-remote-ops-test" {:redirect? false :create-first-block? false :uuid uuid1})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
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

    (op-mem-layer/init-empty-ops-store! repo)
    (op-mem-layer/add-ops! repo [["move" {:block-uuid (str uuid2) :epoch 1}]
                                         ["move" {:block-uuid (str uuid4) :epoch 2}]
                                         ["move" {:block-uuid (str uuid3) :epoch 3}]
                                         ["update" {:block-uuid (str uuid4) :epoch 4}]])
    (let [_ (op-mem-layer/new-branch! repo)
          r1 (rtc-core/gen-block-uuid->remote-ops repo conn :n 1)
          _ (op-mem-layer/rollback! repo)
          r2 (rtc-core/gen-block-uuid->remote-ops repo conn :n 2)]
      (is (= {uuid2 [:move]}
             (update-vals r1 keys)))
      (is (= {uuid2 [:move]
              uuid3 [:move]
              uuid4 [:move :update]}
             (update-vals r2 keys))))
    (op-mem-layer/remove-ops-store! repo)))


(deftest apply-remote-move-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        page-name "apply-remote-move-ops-test"
        [page-uuid
         uuid1-client uuid2-client
         uuid1-remote uuid2-remote] (repeatedly random-uuid)]
    (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/content "uuid1-client"
        :block/left [:block/uuid page-uuid]
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/content "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page-uuid]}]
      (d/pull @conn '[*] [:block/name page-name])
      {:sibling? true :keep-uuid? true}))
    (testing "apply-remote-move-ops-test1"
      (let [data-from-ws {:req-id "req-id"
                          :t 1        ;; not used
                          :t-before 0 ;; not used
                          :affected-blocks
                          {uuid1-remote {:op :move
                                         :self uuid1-remote
                                         :parents [page-uuid]
                                         :left page-uuid
                                         :content "uuid1-remote"}}}
            move-ops (#'rtc-core/move-ops-map->sorted-move-ops
                      (:move-ops-map
                       (#'rtc-core/affected-blocks->diff-type-ops
                        repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-move-ops repo conn date-formatter move-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-remote uuid1-client uuid2-client} (set (map :block/uuid page-blocks))))
          (is (= page-uuid (:block/uuid (:block/left (d/entity @conn [:block/uuid uuid1-remote]))))))))

    (testing "apply-remote-move-ops-test2"
      (let [data-from-ws {:req-id "req-id"
                          :t 1 ;; not used
                          :t-before 0
                          :affected-blocks
                          {uuid2-remote {:op :move
                                         :self uuid2-remote
                                         :parents [uuid1-client]
                                         :left uuid1-client
                                         :content "uuid2-remote"}
                           uuid1-remote {:op :move
                                         :self uuid1-remote
                                         :parents [uuid2-remote]
                                         :left uuid2-remote}}}
            move-ops (#'rtc-core/move-ops-map->sorted-move-ops
                      (:move-ops-map
                       (#'rtc-core/affected-blocks->diff-type-ops
                        repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-move-ops repo conn date-formatter move-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-remote uuid2-remote uuid1-client uuid2-client} (set (map :block/uuid page-blocks))))
          (is (= uuid1-client (:block/uuid (:block/left (d/entity @conn [:block/uuid uuid2-remote])))))
          (is (= uuid2-remote (:block/uuid (:block/left (d/entity @conn [:block/uuid uuid1-remote]))))))))))


(deftest ^:large-vars/cleanup-todo apply-remote-update-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        page-name "apply-remote-update-ops-test"
        [page-uuid
         uuid1-client uuid2-client
         uuid1-remote
         uuid1-not-exist
         tag1-uuid] (repeatedly random-uuid)]
    (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/content "uuid1-client"
        :block/left [:block/uuid page-uuid]
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/content "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page-uuid]}]
      (d/pull @conn '[*] [:block/name page-name])
      {:sibling? true :keep-uuid? true}))
    (testing "apply-remote-update-ops-test1"
      (let [data-from-ws {:req-id "req-id"
                          :t 1 ;; not used
                          :t-before 0
                          :affected-blocks
                          {uuid1-remote {:op :update-attrs
                                         :self uuid1-remote
                                         :parents [uuid1-client]
                                         :left uuid1-client
                                         :content "uuid2-remote"
                                         :created-at 1
                                         :link uuid1-client
                                         :type ["property"]}}}
            update-ops (vals
                        (:update-ops-map
                         (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-ops repo conn date-formatter update-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-client uuid2-client uuid1-remote} (set (map :block/uuid page-blocks))))
          (is (= [uuid1-client #{"property"}]
                 ((juxt (comp :block/uuid :block/link) :block/type) (d/entity @conn [:block/uuid uuid1-remote])))))))

    (testing "apply-remote-update-ops-test2"
      (let [data-from-ws {:req-id "req-id"
                          :t 1
                          :t-before 0
                          :affected-blocks
                          {uuid1-remote {:op :update-attrs
                                         :self uuid1-remote
                                         :parents [uuid1-client]
                                         :left uuid1-client
                                         :content "uuid2-remote"
                                         :created-at 1
                                         :link nil
                                         :type nil}}}
            update-ops (vals
                        (:update-ops-map
                         (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-ops repo conn date-formatter update-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-client uuid2-client uuid1-remote} (set (map :block/uuid page-blocks))))
          (is (= [nil nil] ((juxt :block/link :block/type) (d/entity @conn [:block/uuid uuid1-remote])))))))
    (testing "apply-remote-update-ops-test3"
      (let [data-from-ws {:req-id "req-id"
                          :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-remote {:op :update-attrs
                                         :self uuid1-remote
                                         :parents [uuid2-client]
                                         :left uuid2-client
                                         :link uuid1-not-exist}}}
            update-ops (vals
                        (:update-ops-map
                         (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-ops repo conn date-formatter update-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-client uuid2-client uuid1-remote} (set (map :block/uuid page-blocks))))
          (is (= [nil nil] ((juxt :block/link :block/type) (d/entity @conn [:block/uuid uuid1-remote])))))))
    (testing "update-attr :block/tags"
      (let [data-from-ws {:req-id "req-id"
                          :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-remote {:op :update-attrs
                                         :self uuid1-remote
                                         :parents [uuid2-client]
                                         :left uuid2-client
                                         :tags [tag1-uuid]}}}
            update-ops (vals
                        (:update-ops-map
                         (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (d/transact! conn [{:block/uuid tag1-uuid
                            :block/journal? false,
                            :block/type #{"class"},
                            :block/name "task",
                            :block/original-name "Task"}])
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-ops repo conn date-formatter update-ops)
        (is (= #{tag1-uuid} (set (map :block/uuid (:block/tags (d/entity @conn [:block/uuid uuid1-remote]))))))))))

(deftest apply-remote-remove-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        page-name "apply-remote-remove-ops-test"
        [page-uuid
         uuid1-client uuid2-client
         uuid1-not-exist] (repeatedly random-uuid)]
    (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/content "uuid1-client"
        :block/left [:block/uuid page-uuid]
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/content "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page-uuid]}]
      (d/pull @conn '[*] [:block/name page-name])
      {:sibling? true :keep-uuid? true}))
    (testing "apply-remote-remove-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-client {:op :remove
                                         :block-uuid uuid1-not-exist}}}
            remove-ops
            (vals
             (:remove-ops-map
              (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1-client uuid2-client} (set (map :block/uuid page-blocks)))))))
    (testing "apply-remote-remove-ops-test2"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-client {:op :remove
                                         :block-uuid uuid1-client}}}
            remove-ops (vals
                        (:remove-ops-map
                         (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid2-client} (set (map :block/uuid page-blocks)))))))))

(deftest apply-remote-remove-ops-test2
  (testing "
origin:
- 1
- 2
- 3
client: ;; move 3 as child of 2
- 1
- 2
  - 3
server: ;; remove 2
- 1
- 3"
    (let [repo (state/get-current-repo)
          conn (conn/get-db repo false)
          date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
          opts {:persist-op? false
                :transact-opts {:repo repo
                                :conn conn}}
          page-name "apply-remote-remove-ops-test2"
          [page-uuid
           uuid1 uuid2 uuid3] (repeatedly random-uuid)]
      (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
      (outliner-tx/transact!
       opts
       (outliner-core/insert-blocks!
        ;; - 1
        ;; - 2
        ;;   - 3
        repo conn
        [{:block/uuid uuid1 :block/content "1"
          :block/left [:block/uuid page-uuid]
          :block/parent [:block/uuid page-uuid]}
         {:block/uuid uuid2 :block/content "2"
          :block/left [:block/uuid uuid1]
          :block/parent [:block/uuid page-uuid]}
         {:block/uuid uuid3 :block/content "3"
          :block/left [:block/uuid uuid2]
          :block/parent [:block/uuid uuid2]}]
        (d/pull @conn '[*] [:block/name page-name])
        {:sibling? false :keep-uuid? true}))
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid2 {:op :remove
                                  :block-uuid uuid2}}}
            remove-ops
            (vals
             (:remove-ops-map
              (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn page-name {})]
          (is (= #{uuid1 uuid3} (set (map :block/uuid page-blocks))))
          (is (= page-uuid (:block/uuid (:block/left (d/entity @conn [:block/uuid uuid3]))))))))))


(deftest apply-remote-update&remove-page-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        [page1-uuid] (repeatedly random-uuid)]
    (testing "apply-remote-update-page-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :update-page
                                       :self page1-uuid
                                       :page-name (str page1-uuid)
                                       :original-name (str page1-uuid)}}}
            update-page-ops (vals
                             (:update-page-ops-map
                              (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-page-ops repo conn date-formatter update-page-ops)
        (is (= page1-uuid (:block/uuid (d/entity @conn [:block/uuid page1-uuid]))))))

    (testing "apply-remote-update-page-ops-test2"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :update-page
                                       :self page1-uuid
                                       :page-name (str page1-uuid "-rename")
                                       :original-name (str page1-uuid "-rename")}}}
            update-page-ops (vals
                             (:update-page-ops-map
                              (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-update-page-ops repo conn date-formatter update-page-ops)
        (is (= (str page1-uuid "-rename") (:block/name (d/entity @conn [:block/uuid page1-uuid]))))))

    (testing "apply-remote-remove-page-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :remove-page
                                       :block-uuid page1-uuid}}}
            remove-page-ops (vals
                             (:remove-page-ops-map
                              (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-const/data-from-ws-validator data-from-ws))
        (rtc-core/apply-remote-remove-page-ops repo conn remove-page-ops)
        (is (nil? (d/entity @conn [:block/uuid page1-uuid])))))))


(deftest same-name-two-pages-merge-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}
        page-name "same-name-page-test"
        [page1-uuid page2-uuid
         uuid1-client uuid2-client
         uuid1-remote uuid2-remote] (repeatedly random-uuid)]
    (page-handler/create! page-name {:redirect? false :create-first-block? false :uuid page1-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/content "uuid1-client"
        :block/left [:block/uuid page1-uuid]
        :block/parent [:block/uuid page1-uuid]}
       {:block/uuid uuid2-client :block/content "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page1-uuid]}]
      (d/pull @conn '[*] [:block/name page-name])
      {:sibling? true :keep-uuid? true}))
    (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                        :affected-blocks
                        {page2-uuid {:op :update-page
                                     :self page2-uuid
                                     :page-name page-name
                                     :original-name page-name}
                         uuid1-remote {:op :move
                                       :self uuid1-remote
                                       :parents [page2-uuid]
                                       :left page2-uuid
                                       :content "uuid1-remote"}
                         uuid2-remote {:op :move
                                       :self uuid2-remote
                                       :parents [page2-uuid]
                                       :left uuid1-remote
                                       :content "uuid2-remote"}}}
          all-ops (#'rtc-core/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))
          update-page-ops (vals (:update-page-ops-map all-ops))
          move-ops (#'rtc-core/move-ops-map->sorted-move-ops (:move-ops-map all-ops))]
      (is (rtc-const/data-from-ws-validator data-from-ws))
      (rtc-core/apply-remote-update-page-ops repo conn date-formatter update-page-ops)
      (rtc-core/apply-remote-move-ops repo conn date-formatter move-ops)
      (is (= #{uuid1-client uuid2-client uuid1-remote uuid2-remote}
             (set (map :block/uuid (ldb/get-page-blocks @conn page-name {})))))
      (is (= page2-uuid (:block/uuid (d/entity @conn [:block/name page-name])))))))
