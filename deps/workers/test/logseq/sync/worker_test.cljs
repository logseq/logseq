(ns logseq.sync.worker-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.sync.order :as sync-order]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.dispatch :as dispatch]))

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

(deftest dispatch-worker-fetch-sessions-service-unavailable-test
  (async done
         (let [request (platform/request "http://example.com/sessions/session-1" #js {:method "GET"})
               resp (dispatch/handle-worker-fetch request #js {})]
           (-> (.then resp (fn [resolved]
                             (is (= 503 (.-status resolved)))
                             (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest dispatch-worker-fetch-planning-service-unavailable-test
  (async done
         (let [request (platform/request "http://example.com/planning/sessions" #js {:method "POST"})
               resp (dispatch/handle-worker-fetch request #js {})]
           (-> (.then resp (fn [resolved]
                             (is (= 503 (.-status resolved)))
                             (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest dispatch-worker-fetch-sessions-forward-to-agents-service-test
  (async done
         (let [request (platform/request "http://example.com/sessions/session-2/events?since=1" #js {:method "GET"})
               captured-url (atom nil)
               env #js {:AGENTS_SERVICE #js {:fetch (fn [forwarded]
                                                      (reset! captured-url (.-url forwarded))
                                                      (js/Promise.resolve
                                                       (js/Response. (js/JSON.stringify #js {:ok true})
                                                                     #js {:status 202
                                                                          :headers #js {"content-type" "application/json"}})))}}]
           (-> (dispatch/handle-worker-fetch request env)
               (.then (fn [resolved]
                        (is (= 202 (.-status resolved)))
                        (is (= "http://example.com/sessions/session-2/events?since=1" @captured-url))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest dispatch-worker-fetch-planning-forward-to-agents-service-test
  (async done
         (let [request (platform/request "http://example.com/planning/sessions" #js {:method "POST"
                                                                                     :headers #js {"content-type" "application/json"}
                                                                                     :body (js/JSON.stringify #js {:session-id "plan-1"})})
               captured-url (atom nil)
               env #js {:AGENTS_SERVICE #js {:fetch (fn [forwarded]
                                                      (reset! captured-url (.-url forwarded))
                                                      (js/Promise.resolve
                                                       (js/Response. (js/JSON.stringify #js {:ok true})
                                                                     #js {:status 202
                                                                          :headers #js {"content-type" "application/json"}})))}}]
           (-> (dispatch/handle-worker-fetch request env)
               (.then (fn [resolved]
                        (is (= 202 (.-status resolved)))
                        (is (= "http://example.com/planning/sessions" @captured-url))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest dispatch-worker-fetch-sessions-local-retry-test
  (async done
         (let [request (platform/request "http://127.0.0.1:8787/sessions/session-3"
                                         #js {:method "POST"
                                              :headers #js {"content-type" "application/json"}
                                              :body (js/JSON.stringify #js {:id "session-3"})})
               call-count (atom 0)
               env #js {:AGENTS_SERVICE #js {:fetch (fn [_forwarded]
                                                      (let [count (swap! call-count inc)]
                                                        (if (< count 3)
                                                          (js/Promise.resolve
                                                           (js/Response. "agents starting"
                                                                         #js {:status 503}))
                                                          (js/Promise.resolve
                                                           (js/Response. (js/JSON.stringify #js {:ok true})
                                                                         #js {:status 201
                                                                              :headers #js {"content-type" "application/json"}})))))}}]
           (-> (dispatch/handle-worker-fetch request env)
               (.then (fn [resolved]
                        (is (= 201 (.-status resolved)))
                        (is (= 3 @call-count))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))
