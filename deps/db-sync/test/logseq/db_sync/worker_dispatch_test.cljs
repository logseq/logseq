(ns logseq.db-sync.worker-dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(defn- ok-json-response []
  (js/Response. (js/JSON.stringify #js {:ok true})
                #js {:status 200
                     :headers #js {"content-type" "application/json"}}))

(defn- make-do-namespace []
  #js {:idFromName (fn [_graph-id] "do-id")
       :get (fn [_do-id]
              #js {:fetch (fn [_request]
                            (js/Promise.resolve (ok-json-response)))})})

(deftest admin-token-bypasses-graph-access-check-for-sync-route-test
  (async done
         (let [access-check-calls (atom 0)
               request (js/Request. "http://localhost/sync/graph-1/snapshot/download"
                                    #js {:method "GET"
                                         :headers #js {"x-db-sync-admin-token" "test-admin-token"}})
               env #js {"DB_SYNC_ADMIN_TOKEN" "test-admin-token"
                        "LOGSEQ_SYNC_DO" (make-do-namespace)}]
           (-> (p/with-redefs [index-handler/graph-access-response (fn [_request _env _graph-id]
                                                                     (swap! access-check-calls inc)
                                                                     (p/resolved (http/unauthorized)))]
                 (p/let [resp (dispatch/handle-worker-fetch request env)
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= true (:ok body)))
                   (is (= 0 @access-check-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest admin-token-bypasses-graph-access-check-for-assets-route-test
  (async done
         (let [access-check-calls (atom 0)
               request (js/Request. "http://localhost/assets/graph-1/snapshot-1.snapshot"
                                    #js {:method "GET"
                                         :headers #js {"x-db-sync-admin-token" "test-admin-token"}})
               env #js {"DB_SYNC_ADMIN_TOKEN" "test-admin-token"}]
           (-> (p/with-redefs [index-handler/graph-access-response (fn [_request _env _graph-id]
                                                                     (swap! access-check-calls inc)
                                                                     (p/resolved (http/unauthorized)))
                               assets-handler/handle (fn [_request _env]
                                                       (ok-json-response))]
                 (p/let [resp (dispatch/handle-worker-fetch request env)
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= true (:ok body)))
                   (is (= 0 @access-check-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
