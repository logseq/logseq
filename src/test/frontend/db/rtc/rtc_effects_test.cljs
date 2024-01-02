(ns frontend.db.rtc.rtc-effects-test
  "This ns include tests abouts rtc-part with other components.
  These tests need to start the rtc-loop.
  Other simple fn tests are located at `frontend.db.rtc.rtc-fns-test`"
  (:require ["/frontend/idbkv" :as idb-keyval]
            [cljs.core.async :as async :refer [<! >! go timeout]]
            [clojure.test :as t :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.fixture :as rtc-fixture]
            [frontend.db.rtc.idb-keyval-mock :as idb-keyval-mock :include-macros true]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.test.helper :as test-helper :include-macros true]
            [spy.core :as spy]))

(use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  rtc-fixture/listen-test-db-fixture
  rtc-fixture/start-and-stop-rtc-loop-fixture
  rtc-fixture/clear-op-mem-stores-fixture)


(deftest check-idbkv-mocked
  (idb-keyval-mock/with-reset-idb-keyval-mock reset
    (is (= idb-keyval-mock/Store (type (idb-keyval/newStore "db-name" "store-name"))))
    (reset)))

(deftest rtc-loop-init-test
  (let [ws @(:*ws @rtc-fixture/*test-rtc-state)
        handler-fn (:handler-fn ws)
        last-ws-msg (first (spy/last-call handler-fn))]
    (is (= "register-graph-updates" (:action last-ws-msg)))))


(deftest gen-local-ops-test--create-page
  (idb-keyval-mock/with-reset-idb-keyval-mock reset
    (page-handler/create! "gen-local-ops-test-1" {:redirect? false :create-first-block? false})
    (is (= 1 (op-mem-layer/get-unpushed-block-update-count test-helper/test-db)))
    (reset)))


(deftest gen-local-ops-test-2--create-page&insert-blocks
  (idb-keyval-mock/with-reset-idb-keyval-mock reset
    (let [conn (conn/get-db test-helper/test-db false)]
      (page-handler/create! "gen-local-ops-test-2--create-page&insert-blocks"
                            {:redirect? false :create-first-block? false})
      (let [page-block (d/pull @conn '[*] [:block/name "gen-local-ops-test-2--create-page&insert-blocks"])
            [block-uuid1 block-uuid2] (repeatedly random-uuid)]
        (outliner-tx/transact!
         {}
         (outliner-core/insert-blocks!
          test-helper/test-db
          conn
          [{:block/uuid block-uuid1 :block/content "block1"}
           {:block/uuid block-uuid2 :block/content "block2"
            :block/left [:block/uuid block-uuid1]
            :block/parent [:block/uuid (:block/uuid page-block)]}]
          page-block
          {:sibling? true :keep-uuid? true}))
        (let [ops (op-mem-layer/get-all-ops test-helper/test-db)
              ops* (sort-by (comp :epoch second) < ops)
              [update-page-op move-op-1 update-op-1 move-op-2 update-op-2]
              (map (fn [op] [(first op) (dissoc (second op) :epoch)]) ops*)]
          (is (= "update-page" (first update-page-op)))
          (is (= ["move" {:block-uuid block-uuid1}] move-op-1))
          (is (= ["update" {:block-uuid block-uuid1 :updated-attrs {:content nil}}] update-op-1))
          (is (= ["move" {:block-uuid block-uuid2}] move-op-2))
          (is (= ["update" {:block-uuid block-uuid2 :updated-attrs {:content nil}}] update-op-2)))))
    (reset)))


(deftest push-data-from-ws-test-1
  (t/async
   done
   (idb-keyval-mock/with-reset-idb-keyval-mock reset
     (go
       (let [conn (conn/get-db test-helper/test-db false)
             ws @(:*ws @rtc-fixture/*test-rtc-state)
             push-data-to-client-chan (:push-data-to-client-chan ws)]
         ;; set local-t & graph-uuid in mock-indexeddb-store
         (op-mem-layer/update-local-tx! test-helper/test-db rtc-fixture/test-graph-init-local-t)
         (op-mem-layer/update-graph-uuid! test-helper/test-db rtc-fixture/test-graph-uuid)
         (>! push-data-to-client-chan {:req-id "push-updates"
                                       :t 2 :t-before 1
                                       :affected-blocks
                                       {"26c4b513-e251-4ce9-a421-364b774eb736"
                                        {:op :update-page
                                         :self "26c4b513-e251-4ce9-a421-364b774eb736"
                                         :page-name "push-data-from-ws-test-1"
                                         :original-name "Push-Data-From-Ws-Test-1"}}})
         (<! (timeout 500))
         (is (= {:block/uuid #uuid "26c4b513-e251-4ce9-a421-364b774eb736"
                 :block/original-name "Push-Data-From-Ws-Test-1"}
                (select-keys (d/pull @conn '[*] [:block/name "push-data-from-ws-test-1"])
                             [:block/uuid :block/original-name])))
         (reset)
         (done))))))
