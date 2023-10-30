(ns frontend.db.rtc-test
  (:require ["/frontend/idbkv" :as idb-keyval]
            [cljs.core.async :as async :refer [<! go timeout]]
            [clojure.test :as t :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.fixture :as rtc-fixture]
            [frontend.db.rtc.idb-keyval-mock :as idb-keyval-mock :include-macros true]
            [frontend.db.rtc.op :as rtc-op]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.test.helper :as test-helper :include-macros true]
            [spy.core :as spy]))

(use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  rtc-fixture/listen-test-db-fixture
  rtc-fixture/start-and-stop-rtc-loop-fixture
  rtc-fixture/clear-ops-idb-stores-fixture)


(deftest check-idbkv-mocked
  (idb-keyval-mock/with-reset-idb-keyval-mock reset
    (is (= idb-keyval-mock/Store (type (idb-keyval/newStore "db-name" "store-name"))))
    (reset)))

(deftest rtc-loop-init-test
  (let [ws @(:*ws @rtc-fixture/*test-rtc-state)
        push-data-fn (:push-data-fn ws)
        last-ws-msg (first (spy/last-call push-data-fn))]
    (is (= "register-graph-updates" (:action last-ws-msg)))))


(deftest gen-local-ops-test--create-page
  (t/async
   done
   (idb-keyval-mock/with-reset-idb-keyval-mock reset
     (go
       (page-handler/create! "gen-local-ops-test-1" {:redirect? false :create-first-block? false})
       (<! (timeout 500))
       (let [{:keys [ops]} (<! (rtc-op/<get-ops&local-tx test-helper/test-db))]
         (is (= 1 (count ops)))
         (is (= "update-page" (first (second (first ops))))))
       (reset)
       (done)))))


(deftest gen-local-ops-test-2--create-page&insert-blocks
  (t/async
   done
   (idb-keyval-mock/with-reset-idb-keyval-mock reset
     (go
       (let [conn (conn/get-db test-helper/test-db false)]
         (page-handler/create! "gen-local-ops-test-2--create-page&insert-blocks"
                               {:redirect? false :create-first-block? false})
         (let [page-block (d/pull @conn '[*] [:block/name "gen-local-ops-test-2--create-page&insert-blocks"])
               [block-uuid1 block-uuid2] (repeatedly random-uuid)]
           (outliner-tx/transact!
            {}
            (outliner-core/insert-blocks! [{:block/uuid block-uuid1 :block/content "block1"}
                                           {:block/uuid block-uuid2 :block/content "block2"
                                            :block/left [:block/uuid block-uuid1]
                                            :block/parent [:block/uuid (:block/uuid page-block)]}]
                                          page-block
                                          {:sibling? true :keep-uuid? true}))
           (<! (timeout 500))
           (let [{:keys [ops]} (<! (rtc-op/<get-ops&local-tx test-helper/test-db))
                 sorted-ops (sort-by first < ops)
                 ops* (map second ops)
                 [update-page-op move-op-1 update-op-1 move-op-2 update-op-2] ops*]
             (is (= sorted-ops ops))
             (is (= "update-page" (first update-page-op)))
             (is (= ["move" {:block-uuids [(str block-uuid1)]}] move-op-1))
             (is (= ["update" {:block-uuid (str block-uuid1) :updated-attrs {:content nil}}] update-op-1))
             (is (= ["move" {:block-uuids [(str block-uuid2)]}] move-op-2))
             (is (= ["update" {:block-uuid (str block-uuid2) :updated-attrs {:content nil}}] update-op-2)))))
       (reset)
       (done)))))
