(ns logseq.db-sync.worker-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.order :as sync-order]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]))

(defn- new-conn []
  (d/create-conn db-schema/schema))

(deftest duplicate-order-fix-test
  (let [conn (new-conn)
        parent (random-uuid)
        block-a (random-uuid)
        block-b (random-uuid)
        order-a (db-order/gen-key nil nil)
        order-b (db-order/gen-key order-a nil)]
    (d/transact! conn [{:block/uuid parent}
                       {:block/uuid block-a
                        :block/parent [:block/uuid parent]
                        :block/order order-a}
                       {:block/uuid block-b
                        :block/parent [:block/uuid parent]
                        :block/order order-b}])
    (let [tx [[:db/add [:block/uuid block-b] :block/order order-a]]
          _ (sync-order/fix-duplicate-orders! conn tx {})
          order-a' (:block/order (d/entity @conn [:block/uuid block-a]))
          order-b' (:block/order (d/entity @conn [:block/uuid block-b]))]
      (is (= order-a order-a'))
      (is (not= order-a' order-b')))))

(deftest dispatch-worker-fetch-returns-promise-test
  (async done
         (let [request (platform/request "http://example.com/health" #js {:method "GET"})
               resp (dispatch/handle-worker-fetch request #js {})]
           (is (fn? (.-then resp)))
           (is (fn? (.-catch resp)))
           (-> (.then resp (fn [resolved]
                             (is (= 200 (.-status resolved)))
                             (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))
