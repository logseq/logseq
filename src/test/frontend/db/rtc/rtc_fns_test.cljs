(ns frontend.db.rtc.rtc-fns-test
  (:require [clojure.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.core :as rtc-core]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]))


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
        [uuid1 uuid2 uuid3 uuid4] (repeatedly random-uuid)]
    (page-handler/create! "gen-remote-ops-test" {:redirect? false :create-first-block? false :uuid uuid1})
    (outliner-tx/transact!
     {:persist-op? false}
     (outliner-core/insert-blocks!
      test-helper/test-db
      conn
      [{:block/uuid uuid2 :block/content "uuid2-block"}
       {:block/uuid uuid3 :block/content "uuid3-block"
        :block/left [:block/uuid uuid2]
        :block/parent [:block/uuid (:block/uuid uuid1)]}
       {:block/uuid uuid4 :block/content "uuid4-block"
        :block/left [:block/uuid uuid3]
        :block/parent [:block/uuid (:block/uuid uuid1)]}]
      (d/pull @conn '[*] [:block/name "gen-remote-ops-test"])
      {:sibling? true :keep-uuid? true}))

    (op-mem-layer/init-empty-ops-store! test-helper/test-db)
    (op-mem-layer/add-ops! test-helper/test-db [["move" {:block-uuid (str uuid2) :epoch 1}]
                                                ["move" {:block-uuid (str uuid4) :epoch 2}]
                                                ["move" {:block-uuid (str uuid3) :epoch 3}]
                                                ["update" {:block-uuid (str uuid4) :epoch 4}]])
    (let [_ (op-mem-layer/new-branch! test-helper/test-db)
          r1 (rtc-core/gen-block-uuid->remote-ops test-helper/test-db :n 1)
          _ (op-mem-layer/rollback! test-helper/test-db)
          r2 (rtc-core/gen-block-uuid->remote-ops test-helper/test-db :n 2)]
      (is (= {uuid2 [:move]}
             (update-vals r1 keys)))
      (is (= {uuid2 [:move]
              uuid3 [:move]
              uuid4 [:move :update]}
             (update-vals r2 keys))))
    (op-mem-layer/remove-ops-store! test-helper/test-db))
  (state/set-current-repo! nil)
  (test-helper/destroy-test-db!))
