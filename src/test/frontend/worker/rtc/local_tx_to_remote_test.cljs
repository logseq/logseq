(ns frontend.worker.rtc.local-tx-to-remote-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.fixture :as rtc-fixture]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))


(use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture
  rtc-fixture/listen-test-db-fixture
  rtc-fixture/clear-op-mem-stores-fixture)

(deftest local-db-tx->remote-ops-test
  (let [repo (state/get-current-repo)
        conn (conn/get-db repo false)
        [page1-uuid
         uuid1 uuid2] (repeatedly random-uuid)
        page1-name (str page1-uuid)
        date-formatter (common-config/get-date-formatter (worker-state/get-config repo))
        opts {:persist-op? true
              :transact-opts {:repo repo
                              :conn conn}}
        gen-ops-fn (fn []
                     (let [r (rtc-const/to-ws-ops-decoder
                              (rtc-core/sort-remote-ops
                               ;; FIXME: Remove ignore when test is fixed
                               #_:clj-kondo/ignore
                               (rtc-core/gen-block-uuid->remote-ops repo conn)))]
                       (is (rtc-const/to-ws-ops-validator r) r)
                       r))]
    (testing "create a new page"
      (page-handler/create! page1-name {:redirect? false :create-first-block? false :uuid page1-uuid})
      (let [ops (gen-ops-fn)]
        (is (= [[:update-page {:block-uuid page1-uuid
                               :page-name page1-name
                               :original-name page1-name}]] ops))))

    (testing "insert some blocks"
      (outliner-tx/transact!
       opts
       (outliner-core/insert-blocks!
        repo
        conn
        [{:block/uuid uuid1 :block/content "uuid1-client"
          :block/left [:block/uuid page1-uuid]
          :block/parent [:block/uuid page1-uuid]}
         {:block/uuid uuid2 :block/content "uuid2-client"
          :block/left [:block/uuid uuid1]
          :block/parent [:block/uuid page1-uuid]}]
        (d/pull @conn '[*] [:block/name page1-name])
        {:sibling? true :keep-uuid? true}))
      (let [ops (gen-ops-fn)]
        (is (= #{[:move uuid1 page1-uuid]
                 [:move uuid2 uuid1]
                 [:update uuid1 page1-uuid]
                 [:update uuid2 uuid1]}
               (set (map (juxt first (comp :block-uuid second) (comp :target-uuid second)) ops))))))

    (testing "remove some blocks"
      (outliner-tx/transact!
       opts
       (outliner-core/delete-blocks!
        repo
        conn
        date-formatter
        [(d/entity @conn [:block/uuid uuid1])]
        opts))
      (let [ops (gen-ops-fn)]
        (is (contains? (set ops) [:remove {:block-uuids [uuid1]}]))))))
