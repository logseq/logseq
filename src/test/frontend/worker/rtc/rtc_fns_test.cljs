(ns frontend.worker.rtc.rtc-fns-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.fixtures :as worker-fixtures]
            [frontend.worker.rtc.malli-schema :as rtc-schema]
            [frontend.worker.rtc.remote-update :as r.remote]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))

(use-fixtures :each
  test-helper/db-based-start-and-destroy-db
  (worker-fixtures/listen-test-db-fixture [:sync-db-to-main-thread]))

(deftest ^:large-vars/cleanup-todo update-remote-data-by-local-unpushed-ops-test
  (testing "case1"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :move
            :self uuid1
            :parents [uuid2]
            :block/order "a0"
            :block/title "content-str"}}
          unpushed-ops
          [[:update 1 {:block-uuid uuid1
                       :av-coll [[:block/title "new-content-str" 1 true]]}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :move
               :self uuid1
               :parents [uuid2]
               :block/order "a0"
               :block/title "new-content-str"}}
             r))))
  (testing "case2"
    (let [[uuid1] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :remove
            :block-uuid uuid1}}
          unpushed-ops
          [[:move 1 {:block-uuid uuid1}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (empty? r))))

  (testing "case3"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :move
            :self uuid1
            :parents [uuid2]
            :block/order "a0"}}
          unpushed-ops
          [[:move 1 {:block-uuid uuid1}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (empty? r))))

  (testing "case4: update remote :update-attrs op"
    (let [[uuid1 uuid2] (repeatedly random-uuid)
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]
            :block/order "a0"
            :block/title "update content"}}
          unpushed-ops
          [[:move 1 {:block-uuid uuid1}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :block/title "update content"}}
             r))))
  (testing "case5: card-many+ref attr"
    (let [[uuid1 uuid2] (repeatedly random-uuid)
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]
            :user.property/ppp [#uuid "6752bdee-7963-4a6a-84a4-86cd456b470c"
                                #uuid "6752bdf0-ee32-40af-8abb-3f8d179ba367"]}}
          unpushed-ops
          [[:update 536871132
            {:block-uuid uuid1
             :av-coll
             [[:user.property/ppp
               #uuid "6752bdee-7963-4a6a-84a4-86cd456b470c"
               536871128
               true]
              [:user.property/ppp
               #uuid "6752bdf0-ee32-40af-8abb-3f8d179ba367"
               536871132
               false]
              [:user.property/ppp
               #uuid "6752bdf0-ee32-40af-8abb-3f8d179ba888"
               536871132
               true]]}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :parents [uuid2]
               :user.property/ppp
               [#uuid "6752bdee-7963-4a6a-84a4-86cd456b470c"
                #uuid "6752bdf0-ee32-40af-8abb-3f8d179ba888"]}}
             r))))
  (testing "case6: toggle status"
    (let [[uuid1 uuid2 status-value-uuid] (repeatedly random-uuid)
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]}}
          unpushed-ops
          [[:update
            536872312
            {:block-uuid uuid1
             :av-coll
             [[:logseq.task/status status-value-uuid 536872312 true]]}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :parents [uuid2]
               :logseq.task/status [status-value-uuid]}}
             r))))
  (testing "case7: toggle status(2)"
    (let [[uuid1 uuid2 status-value-uuid1 status-value-uuid2] (repeatedly random-uuid)
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]}}
          unpushed-ops
          [[:update
            536872314
            {:block-uuid uuid1
             :av-coll
             [[:logseq.task/status status-value-uuid1 536872312 true]
              [:logseq.task/status status-value-uuid1 536872312 false]
              [:logseq.task/status status-value-uuid2 536872314 true]]}]]
          r (#'r.remote/update-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :parents [uuid2]
               :logseq.task/status [status-value-uuid2]}}
             r)))))

(deftest apply-remote-move-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        opts {:persist-op? false
              :transact-opts {:repo repo
                              :conn conn}}
        page-name "apply-remote-move-ops-test"
        [page-uuid
         uuid1-client uuid2-client
         uuid1-remote uuid2-remote] (repeatedly random-uuid)]
    (test-helper/create-page! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/title "uuid1-client"
        :block/order "a1"
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/title "uuid2-client"
        :block/order "a2"
        :block/parent [:block/uuid page-uuid]}]
      (ldb/get-page @conn page-name)
      {:sibling? true :keep-uuid? true}))
    (testing "apply-remote-move-ops-test1"
      (let [data-from-ws {:req-id "req-id"
                          :t 1        ;; not used
                          :t-before 0 ;; not used
                          :affected-blocks
                          {uuid1-remote {:op :move
                                         :self uuid1-remote
                                         :parents [page-uuid]
                                         :block/order "a0"}}}
            move-ops (#'r.remote/move-ops-map->sorted-move-ops
                      (:move-ops-map
                       (#'r.remote/affected-blocks->diff-type-ops
                        repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws) data-from-ws)
        (#'r.remote/apply-remote-move-ops repo conn move-ops)
        (let [page-blocks (ldb/get-page-blocks @conn (:db/id (ldb/get-page @conn page-name)) {})]
          (is (= #{uuid1-remote uuid1-client uuid2-client} (set (map :block/uuid page-blocks)))
              [uuid1-remote uuid1-client uuid2-client])
          (is (= page-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid uuid1-remote]))))))))

    (testing "apply-remote-move-ops-test2"
      (let [data-from-ws {:req-id "req-id"
                          :t 1 ;; not used
                          :t-before 0
                          :affected-blocks
                          {uuid2-remote {:op :move
                                         :self uuid2-remote
                                         :parents [uuid1-client]
                                         :block/order "a0"}
                           uuid1-remote {:op :move
                                         :self uuid1-remote
                                         :parents [uuid2-remote]
                                         :block/order "a1"}}}
            move-ops (#'r.remote/move-ops-map->sorted-move-ops
                      (:move-ops-map
                       (#'r.remote/affected-blocks->diff-type-ops
                        repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-move-ops repo conn move-ops)
        (let [page-blocks (ldb/get-page-blocks @conn (:db/id (ldb/get-page @conn page-name)) {})]
          (is (= #{uuid1-remote uuid2-remote uuid1-client uuid2-client} (set (map :block/uuid page-blocks))))
          (is (= ["a0" "a1"]
                 (mapv (fn [uuid*] (:block/order (d/entity @conn [:block/uuid uuid*])))
                       [uuid2-remote uuid1-remote]))))))))

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
    (test-helper/create-page! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
    (outliner-tx/transact!
     opts
     (outliner-core/insert-blocks!
      repo
      conn
      [{:block/uuid uuid1-client :block/title "uuid1-client"
        :block/left [:block/uuid page-uuid]
        :block/parent [:block/uuid page-uuid]}
       {:block/uuid uuid2-client :block/title "uuid2-client"
        :block/left [:block/uuid uuid1-client]
        :block/parent [:block/uuid page-uuid]}]
      (ldb/get-page @conn page-name)
      {:sibling? true :keep-uuid? true}))
    (testing "apply-remote-remove-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-client {:op :remove
                                         :block-uuid uuid1-not-exist}}}
            remove-ops
            (vals
             (:remove-ops-map
              (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn (:db/id (ldb/get-page @conn page-name)) {})]
          (is (= #{uuid1-client uuid2-client} (set (map :block/uuid page-blocks)))))))
    (testing "apply-remote-remove-ops-test2"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid1-client {:op :remove
                                         :block-uuid uuid1-client}}}
            remove-ops (vals
                        (:remove-ops-map
                         (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn (:db/id (ldb/get-page @conn page-name)) {})]
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
- 3
result:
- 3
- 1"
    (let [repo (state/get-current-repo)
          conn (conn/get-db repo false)
          date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
          opts {:persist-op? false
                :transact-opts {:repo repo
                                :conn conn}}
          page-name "apply-remote-remove-ops-test2"
          [page-uuid
           uuid1 uuid2 uuid3] (repeatedly random-uuid)]
      (test-helper/create-page! page-name {:redirect? false :create-first-block? false :uuid page-uuid})
      (outliner-tx/transact!
       opts
       (outliner-core/insert-blocks!
        ;; - 1
        ;; - 2
        ;;   - 3
        repo conn
        [{:block/uuid uuid1 :block/title "1"
          :block/order "a0"
          :block/parent [:block/uuid page-uuid]}
         {:block/uuid uuid2 :block/title "2"
          :block/order "a1"
          :block/parent [:block/uuid page-uuid]}
         {:block/uuid uuid3 :block/title "3"
          :block/order "a0"
          :block/parent [:block/uuid uuid2]}]
        (ldb/get-page @conn page-name)
        {:sibling? false :keep-uuid? true}))
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {uuid2 {:op :remove
                                  :block-uuid uuid2}}}
            remove-ops
            (vals
             (:remove-ops-map
              (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-remove-ops repo conn date-formatter remove-ops)
        (let [page-blocks (ldb/get-page-blocks @conn (:db/id (ldb/get-page @conn page-name)))]
          (is (= [uuid3 uuid1] (map :block/uuid (sort-by :block/order page-blocks)))))))))

(deftest apply-remote-update&remove-page-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        [page1-uuid ;; page2-uuid page3-uuid page4-uuid
         ](repeatedly random-uuid)]
    (testing "apply-remote-update-page-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :update-page
                                       :self page1-uuid
                                       :page-name (ldb/write-transit-str (str "X" page1-uuid))
                                       :block/title (ldb/write-transit-str (str "X" page1-uuid))}}}
            update-page-ops (vals
                             (:update-page-ops-map
                              (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-update-page-ops repo conn update-page-ops)
        (is (= page1-uuid (:block/uuid (d/entity @conn [:block/uuid page1-uuid]))))))

    (testing "apply-remote-update-page-ops-test2"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :update-page
                                       :self page1-uuid
                                       :page-name (ldb/write-transit-str (str page1-uuid "-rename"))
                                       :block/title (ldb/write-transit-str (str page1-uuid "-rename"))}}}
            update-page-ops (vals
                             (:update-page-ops-map
                              (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-update-page-ops repo conn update-page-ops)
        (is (= (str page1-uuid "-rename") (:block/name (d/entity @conn [:block/uuid page1-uuid]))))))

    (testing "apply-remote-remove-page-ops-test1"
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page1-uuid {:op :remove-page
                                       :block-uuid page1-uuid}}}
            remove-page-ops (vals
                             (:remove-page-ops-map
                              (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-remove-page-ops repo conn remove-page-ops)
        (is (nil? (d/entity @conn [:block/uuid page1-uuid])))))))

;; TODO: add back once page merge get supported
(comment
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
      (test-helper/create-page! page-name {:redirect? false :create-first-block? false :uuid page1-uuid})
      (outliner-tx/transact!
       opts
       (outliner-core/insert-blocks!
        repo
        conn
        [{:block/uuid uuid1-client
          :block/title "uuid1-client"
          :block/left [:block/uuid page1-uuid]
          :block/parent [:block/uuid page1-uuid]}
         {:block/uuid uuid2-client
          :block/title "uuid2-client"
          :block/left [:block/uuid uuid1-client]
          :block/parent [:block/uuid page1-uuid]}]
        (ldb/get-page @conn page-name)
        {:sibling? true :keep-uuid? true}))
      (let [data-from-ws {:req-id "req-id" :t 1 :t-before 0
                          :affected-blocks
                          {page2-uuid {:op :update-page
                                       :self page2-uuid
                                       :page-name page-name
                                       :block/title page-name}
                           uuid1-remote {:op :move
                                         :self uuid1-remote
                                         :parents [page2-uuid]
                                         :left page2-uuid
                                         :block/title "uuid1-remote"}
                           uuid2-remote {:op :move
                                         :self uuid2-remote
                                         :parents [page2-uuid]
                                         :left uuid1-remote
                                         :block/title "uuid2-remote"}}}
            all-ops (#'r.remote/affected-blocks->diff-type-ops repo (:affected-blocks data-from-ws))
            update-page-ops (vals (:update-page-ops-map all-ops))
            move-ops (#'r.remote/move-ops-map->sorted-move-ops (:move-ops-map all-ops))]
        (is (rtc-schema/data-from-ws-validator data-from-ws))
        (#'r.remote/apply-remote-update-page-ops repo conn date-formatter update-page-ops)
        (#'r.remote/apply-remote-move-ops repo conn date-formatter move-ops)
        (let [page (ldb/get-page @conn page-name)]
          (is (= #{uuid1-client uuid2-client uuid1-remote uuid2-remote}
                 (set (map :block/uuid (ldb/get-page-blocks @conn (:db/id page) {})))))
          (is (= page2-uuid (:block/uuid page))))))))
