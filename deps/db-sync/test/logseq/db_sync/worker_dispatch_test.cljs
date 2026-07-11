(ns logseq.db-sync.worker-dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]
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

(defn- json-body [response]
  (p/let [text (.text response)]
    (js->clj (js/JSON.parse text) :keywordize-keys true)))

(defn- semantic-request
  ([path scope]
   (semantic-request path scope "GET"))
  ([path scope method]
   {:request (js/Request. (str "http://localhost" path)
                          #js {:method method
                               :headers #js {"authorization" "Bearer semantic-token"}})
    :claims #js {"sub" "user-1" "scope" scope}}))

(defn- graph-row [e2ee?]
  #js {:graph_e2ee (if e2ee? 1 0)})

(defn- rate-limiter [success? calls]
  #js {:limit (fn [opts]
                (swap! calls conj (js->clj opts :keywordize-keys true))
                (p/resolved #js {:success success?}))})

(defn- capturing-do-namespace [requests]
  #js {:idFromName (fn [graph-id] graph-id)
       :get (fn [_]
              #js {:fetch (fn [request]
                            (swap! requests conj request)
                            (p/resolved (ok-json-response)))})})

(deftest openapi-document-describes-semantic-api-and-oauth-scopes-test
  (async done
         (-> (p/let [response (dispatch/handle-worker-fetch
                               (js/Request. "http://localhost/openapi.json")
                               #js {})
                     body (json-body response)]
               (is (= 200 (.-status response)))
               (is (= "3.1.0" (:openapi body)))
               (is (= ["logseq/read"]
                      (get-in body [:paths (keyword "/api/v1/graphs") :get :security 0 :oauth])))
               (is (= ["logseq/read"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/pages") :get :security 0 :oauth])))
               (is (= ["logseq/write"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/blocks/{block-id}") :patch :security 0 :oauth])))
               (is (= ["logseq/write"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/pages/{page-id}") :delete :security 0 :oauth])))
               (doseq [path ["/api/v1/graphs/{graph-id}/pages/{page-id}"
                             "/api/v1/graphs/{graph-id}/tags/{tag-id}"
                             "/api/v1/graphs/{graph-id}/properties/{property-id}"]]
                 (is (= #{:get :patch :delete} (set (keys (get-in body [:paths (keyword path)]))))))
               (is (= ["logseq/write"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/blocks/{block-id}/properties/{property-id}")
                                    :delete :security 0 :oauth])))
               (is (= ["logseq/write"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/block-properties/batch-delete")
                                    :post :security 0 :oauth])))
               (is (= ["block-ids" "target-id" "position"]
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/block-moves")
                                    :post :requestBody :content :application/json :schema :required])))
               (is (= "array"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/block-moves")
                                    :post :requestBody :content :application/json :schema
                                    :properties :block-ids :type])))
               (is (= "#/components/schemas/BlockResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/pages/{page-id}/blocks")
                                    :get :responses :200 :content :application/json :schema
                                    :properties :blocks :items :$ref])))
               (is (= "#/components/schemas/BlockResponse"
                      (get-in body [:components :schemas :BlockResponse :properties :children :items :$ref])))
               (is (= "listTasks"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/tasks") :get :operationId])))
               (is (= "createTask"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/tasks") :post :operationId])))
               (is (= ["todo" "doing" "in-review" "done" "canceled" "backlog"]
                      (get-in body [:components :schemas :TaskStatusSelector :anyOf 0 :enum])))
               (is (= "#/components/schemas/EntitySelector"
                      (get-in body [:components :schemas :TaskStatusSelector :anyOf 1 :$ref])))
               (is (= "#/components/schemas/PropertyChoice"
                      (get-in body [:components :schemas :TaskResponse :allOf 1 :properties :status :$ref])))
               (is (= "#/components/schemas/TaskResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/tasks")
                                    :get :responses :200 :content :application/json :schema
                                    :properties :tasks :items :$ref])))
               (is (= "#/components/schemas/TaskResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/tasks")
                                    :post :responses :201 :content :application/json :schema :$ref])))
               (is (= "#/components/schemas/PropertyResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/properties/{property-id}")
                                    :get :responses :200 :content :application/json :schema :$ref])))
               (is (= "#/components/schemas/PropertyChoice"
                      (get-in body [:components :schemas :PropertyResponse :properties
                                    :choices :items :$ref])))
               (is (= "#/components/schemas/PropertyValue"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/blocks/{block-id}/properties/{property-id}")
                                    :put :requestBody :content :application/json :schema
                                    :properties :value :$ref])))
               (is (= {:type "boolean" :default false}
                      (select-keys
                       (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/block-properties/batch-set")
                                     :post :requestBody :content :application/json :schema
                                     :properties :isResetExistingValues])
                       [:type :default])))
               (is (string/includes?
                    (get-in body [:components :schemas :PropertyValue :description])
                    "UUID, ident, or title"))
               (is (string/includes?
                    (get-in body [:components :schemas :PropertyValue :description])
                    "TODO"))
               (doseq [[path method] [["/api/v1/graphs/{graph-id}/properties" :post]
                                      ["/api/v1/graphs/{graph-id}/properties/{property-id}" :patch]
                                      ["/api/v1/graphs/{graph-id}/blocks/{block-id}/properties/{property-id}" :put]
                                      ["/api/v1/graphs/{graph-id}/block-properties/batch-set" :post]]]
                 (let [description (get-in body [:paths (keyword path) method :description])]
                   (is (string/includes? description "DB graph"))
                   (is (string/includes? description "typed"))
                   (is (string/includes? description "key:: value"))))
               (doseq [[_ path-operations] (:paths body)
                       [_ operation] path-operations]
                 (is (seq (:summary operation)))
                 (is (seq (:description operation)))))
             (p/then (fn [] (done)))
             (p/catch (fn [error]
                        (is false (str error))
                        (done))))))

(deftest openapi-path-order-matches-operation-registry-test
  (async done
         (-> (p/let [response (dispatch/handle-worker-fetch
                               (js/Request. "http://localhost/openapi.json") #js {})
                      text (.text response)
                      document (js/JSON.parse text)
                      actual (vec (js/Object.keys (aget document "paths")))
                      expected (->> semantic-routes/operations
                                    (map :path)
                                    distinct
                                    (mapv #(string/replace % #":([^/]+)" "{$1}")))]
               (is (= expected actual)))
             (p/then (fn [] (done)))
             (p/catch (fn [error]
                        (is false (str error))
                        (done))))))

(deftest semantic-api-lists-non-e2ee-graphs-with-pagination-test
  (async done
         (let [{:keys [request claims]} (semantic-request "/api/v1/graphs?name=test-mcp&limit=1" "logseq/read")
               calls (atom [])
               limit-calls (atom [])
               env #js {"DB" #js {}
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter true limit-calls)}]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved claims))
                               index/<semantic-graphs-list
                               (fn [_db user-id opts]
                                 (swap! calls conj [user-id opts])
                                 (p/resolved {:graphs [{:graph-id "graph-1" :graph-name "test-mcp"}]
                                              :next-cursor "cursor-1"}))]
                 (p/let [response (dispatch/handle-worker-fetch request env)
                         body (json-body response)]
                   (is (= 200 (.-status response)))
                   (is (= [{:graph-id "graph-1" :graph-name "test-mcp"}] (:graphs body)))
                   (is (= "cursor-1" (:next-cursor body)))
                   (is (= [["user-1" {:name "test-mcp" :limit 1 :cursor nil}]] @calls))
                   (is (= 1 (count @limit-calls)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest semantic-api-rejects-missing-operation-scope-test
  (async done
         (let [{:keys [request claims]} (semantic-request "/api/v1/graphs/graph-1/pages" "logseq/write")]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved claims))]
                 (p/let [response (dispatch/handle-worker-fetch request #js {})
                         body (json-body response)]
                   (is (= 403 (.-status response)))
                   (is (= "insufficient scope" (:error body)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest semantic-api-rejects-e2ee-graphs-before-durable-object-test
  (async done
         (let [{:keys [request claims]} (semantic-request "/api/v1/graphs/graph-1/pages" "logseq/read")
               forwarded (atom [])
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter true (atom []))}]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved claims))
                               index-handler/graph-access-response (fn [_ _ _] (p/resolved (ok-json-response)))
                               common/<d1-all (fn [& _] (p/resolved #js {:results #js [(graph-row true)]}))]
                 (p/let [response (dispatch/handle-worker-fetch request env)
                         body (json-body response)]
                   (is (= 409 (.-status response)))
                   (is (= "semantic-api-unavailable-for-e2ee" (:error body)))
                   (is (empty? @forwarded))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest semantic-api-rate-limit-rejection-does-not-call-durable-object-test
  (async done
         (let [{:keys [request claims]} (semantic-request "/api/v1/graphs/graph-1/pages" "logseq/read")
               forwarded (atom [])
               limit-calls (atom [])
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter false limit-calls)}]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved claims))
                               index-handler/graph-access-response (fn [_ _ _] (p/resolved (ok-json-response)))
                               common/<d1-all (fn [& _] (p/resolved #js {:results #js [(graph-row false)]}))]
                 (p/let [response (dispatch/handle-worker-fetch request env)]
                   (is (= 429 (.-status response)))
                   (is (= "60" (.get (.-headers response) "retry-after")))
                   (is (= 1 (count @limit-calls)))
                   (is (empty? @forwarded))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest semantic-api-forwards-authorized-non-e2ee-request-test
  (async done
         (let [{:keys [request claims]} (semantic-request "/api/v1/graphs/graph-1/pages?limit=10" "logseq/read")
               forwarded (atom [])
               limit-calls (atom [])
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter true limit-calls)}]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved claims))
                               index-handler/graph-access-response (fn [_ _ _] (p/resolved (ok-json-response)))
                               common/<d1-all (fn [& _] (p/resolved #js {:results #js [(graph-row false)]}))]
                 (p/let [response (dispatch/handle-worker-fetch request env)
                         forwarded-request (first @forwarded)
                         forwarded-url (some-> forwarded-request .-url js/URL.)]
                   (is (= 200 (.-status response)))
                   (is (= 1 (count @forwarded)))
                   (when forwarded-url
                     (is (= "/semantic/pages" (.-pathname forwarded-url)))
                     (is (= "10" (.get (.-searchParams forwarded-url) "limit")))
                     (is (= "graph-1" (.get (.-searchParams forwarded-url) "graph-id"))))))
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
