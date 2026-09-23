(ns logseq.db-sync.worker-dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
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

(declare capturing-do-namespace json-body)

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

(deftest public-sync-route-rejects-semantic-tail-without-touching-durable-object-test
  (async done
         (let [forwarded (atom [])
               request (js/Request. "http://localhost/sync/graph-1/semantic/pages"
                                    #js {:method "GET"})
               env #js {"LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)}]
           (-> (p/with-redefs [index-handler/graph-access-response
                               (fn [_request _env _graph-id]
                                 (p/resolved (ok-json-response)))]
                 (p/let [response (dispatch/handle-worker-fetch request env)
                         body (json-body response)]
                   (is (= 404 (.-status response)))
                   (is (= "not found" (:error body)))
                   (is (empty? @forwarded))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest public-sync-route-still-forwards-legacy-snapshot-request-test
  (async done
         (let [forwarded (atom [])
               request (js/Request. "http://localhost/sync/graph-1/snapshot/download"
                                    #js {:method "GET"})
               env #js {"LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)}]
           (-> (p/with-redefs [index-handler/graph-access-response
                               (fn [_request _env _graph-id]
                                 (p/resolved (ok-json-response)))]
                 (p/let [response (dispatch/handle-worker-fetch request env)]
                   (is (= 200 (.-status response)))
                   (is (= 1 (count @forwarded)))
                   (is (= "/snapshot/download"
                          (.-pathname (js/URL. (.-url (first @forwarded))))))))
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
               (let [description (->> (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/blocks/{block-id}/properties/{property-id}")
                                                     :put :parameters])
                                      (filter #(= "property-id" (:name %))) first :description)]
                 (is (and (string? description)
                          (string/includes? description "exact title"))))
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
               (is (= ["default" "number" "date" "datetime" "checkbox" "url" "node" "asset"
                       "map" "json" "string"]
                      (get-in body [:components :schemas :PropertyType :enum])))
               (is (= "#/components/schemas/PropertyType"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/properties")
                                    :post :requestBody :content :application/json :schema
                                    :properties :type :$ref])))
               (doseq [[path response-key schema]
                       [["/api/v1/graphs/{graph-id}/pages" :pages "PageResponse"]
                        ["/api/v1/graphs/{graph-id}/tags" :tags "TagResponse"]
                        ["/api/v1/graphs/{graph-id}/properties" :properties "PropertyResponse"]
                        ["/api/v1/graphs/{graph-id}/search" :results "SearchResultResponse"]]]
                 (is (= (str "#/components/schemas/" schema)
                        (get-in body [:paths (keyword path) :get :responses :200
                                      :content :application/json :schema :properties
                                      response-key :items :$ref]))))
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
               (doseq [path ["/api/v1/graphs/{graph-id}/pages"
                             "/api/v1/graphs/{graph-id}/tasks"
                             "/api/v1/graphs/{graph-id}/tags"
                             "/api/v1/graphs/{graph-id}/tags/{tag-id}/objects"
                             "/api/v1/graphs/{graph-id}/properties"
                             "/api/v1/graphs/{graph-id}/assets"
                             "/api/v1/graphs/{graph-id}/search"]]
                 (is (= #{"created-after" "updated-after"}
                        (->> (get-in body [:paths (keyword path) :get :parameters])
                             (map :name)
                             (filter #{"created-after" "updated-after"})
                             set))
                     path))
               (is (= "listAssets"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets") :get :operationId])))
               (is (= "createAsset"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets") :post :operationId])))
               (is (string/includes?
                    (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets/{asset-block-id}")
                                  :get :description])
                    "display image"))
               (is (= "binary"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets") :post
                                    :requestBody :content :application/octet-stream :schema :format])))
               (is (= #{"file-name" "size" "title" "page-id" "checksum" "encoding"}
                      (->> (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets")
                                         :post :parameters])
                           (map :name)
                           (filter #{"file-name" "size" "title" "page-id" "checksum" "encoding"})
                           set)))
               (is (= "#/components/schemas/AssetResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets") :get
                                    :responses :200 :content :application/json :schema
                                    :properties :assets :items :$ref])))
               (is (= "#/components/schemas/AssetResponse"
                      (get-in body [:paths (keyword "/api/v1/graphs/{graph-id}/assets") :post
                                    :responses :201 :content :application/json :schema :$ref])))
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

(def ^:private pat-year-ms (* 365 24 60 60 1000))

(defn- pat-management-request
  ([method path]
   (pat-management-request method path nil))
  ([method path body]
   (js/Request. (str "http://localhost" path)
                (clj->js (cond-> {:method method
                                  :headers {"authorization" "Bearer login-token"
                                            "content-type" "application/json"}}
                           body (assoc :body (js/JSON.stringify (clj->js body))))))))

(defn- rtc-claims []
  #js {"sub" "user-1"
       "cognito:groups" #js ["rtc_2025_07_10"]})

(defn- d1-results [rows]
  #js {:results (clj->js rows)})

(deftest pat-management-requires-rtc-group-login-jwt-test
  (async done
         (let [request (pat-management-request "GET" "/api/v1/personal-access-tokens")]
           (-> (p/with-redefs [auth/auth-claims
                               (fn [_ _]
                                 (p/resolved #js {"sub" "user-1"
                                                  "cognito:groups" #js ["beta-tester"]}))]
                 (p/let [response (dispatch/handle-worker-fetch request #js {"DB" #js {}})
                         body (json-body response)]
                   (is (= 403 (.-status response)))
                   (is (= "forbidden" (:error body)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-management-does-not-accept-a-pat-as-login-test
  (async done
         (let [request (js/Request. "http://localhost/api/v1/personal-access-tokens"
                                    #js {:headers #js {"authorization" "Bearer logseq_pat_not-a-login-token"}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_ _]
                                 (p/rejected (ex-info "invalid" {})))]
                 (p/let [response (dispatch/handle-worker-fetch request #js {"DB" #js {}})]
                   (is (= 401 (.-status response)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-create-defaults-to-one-year-and-persists-only-a-hash-test
  (async done
         (let [now 1700000000000
               insert-call (atom nil)
               request (pat-management-request
                        "POST"
                        "/api/v1/personal-access-tokens"
                        {:graph-id "graph-1" :permission "both"})]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                               common/now-ms (fn [] now)
                               index/<semantic-graph-get
                               (fn [_ _ graph-id]
                                 (p/resolved {:graph-id graph-id}))
                               common/<d1-run
                               (fn [_ sql & args]
                                 (reset! insert-call {:sql sql :args args})
                                 (p/resolved #js {:success true}))]
                 (p/let [response (dispatch/handle-worker-fetch request #js {"DB" #js {}})
                         body (json-body response)
                         token (:token body)
                         {:keys [sql args]} @insert-call]
                   (is (= 201 (.-status response)))
                   (is (and (string? token)
                            (string/starts-with? token "logseq_pat_")))
                   (is (= "graph-1" (:graph-id body)))
                   (is (= "both" (:permission body)))
                   (is (= (+ now pat-year-ms) (:expires-at body)))
                   (is (and (string? sql)
                            (string/includes? (string/lower-case sql) "personal_access_tokens")))
                   (is (not-any? #(= token %) args))
                   (is (some #(and (string? %)
                                   (re-matches #"[0-9a-f]{64}" %))
                             args))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-create-validates-permission-expiration-and-graph-access-test
  (async done
         (let [now 1700000000000
               env #js {"DB" #js {}}
               request (fn [body]
                         (pat-management-request
                          "POST" "/api/v1/personal-access-tokens" body))]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                               common/now-ms (fn [] now)
                               index/<semantic-graph-get
                               (fn [_ _ graph-id]
                                 (p/resolved (when (= "graph-1" graph-id)
                                               {:graph-id graph-id})))]
                 (p/let [invalid-permission (dispatch/handle-worker-fetch
                                             (request {:graph-id "graph-1" :permission "admin"}) env)
                         expired (dispatch/handle-worker-fetch
                                  (request {:graph-id "graph-1"
                                            :permission "read"
                                            :expires-at now}) env)
                         inaccessible (dispatch/handle-worker-fetch
                                       (request {:graph-id "graph-2"
                                                 :permission "read"}) env)]
                   (is (= 400 (.-status invalid-permission)))
                   (is (= 400 (.-status expired)))
                   (is (= 403 (.-status inaccessible)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-create-rejects-a-graph-that-is-not-semantic-api-eligible-test
  (async done
         (let [request (pat-management-request
                        "POST"
                        "/api/v1/personal-access-tokens"
                        {:graph-id "encrypted-graph" :permission "read"})]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                               index/<user-has-access-to-graph? (fn [_ _ _] (p/resolved true))
                               index/<semantic-graph-get (fn [_ _ _] (p/resolved nil))
                               common/<d1-run (fn [& _] (p/resolved #js {:success true}))]
                 (p/let [response (dispatch/handle-worker-fetch request #js {"DB" #js {}})]
                   (is (= 403 (.-status response)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-list-never-returns-token-hash-and-revoke-is-owner-scoped-test
  (async done
         (let [sql-calls (atom [])
               env #js {"DB" #js {}}
               list-request (pat-management-request "GET" "/api/v1/personal-access-tokens")
               delete-request (pat-management-request "DELETE" "/api/v1/personal-access-tokens/pat-1")]
           (-> (p/with-redefs [auth/auth-claims (fn [_ _] (p/resolved (rtc-claims)))
                               common/<d1-all
                               (fn [_ sql & args]
                                 (swap! sql-calls conj {:op :all :sql sql :args args})
                                 (p/resolved
                                  (d1-results
                                   [{"id" "pat-1"
                                     "graph_id" "graph-1"
                                     "graph_name" "Graph 1"
                                     "token_prefix" "logseq_pat_abcd"
                                     "permission" "read"
                                     "created_at" 10
                                     "expires_at" 20
                                     "token_hash" "must-not-leak"}])))
                               common/<d1-run
                               (fn [_ sql & args]
                                 (swap! sql-calls conj {:op :run :sql sql :args args})
                                 (p/resolved #js {:meta #js {:changes 1}}))]
                 (p/let [list-response (dispatch/handle-worker-fetch list-request env)
                         list-body (json-body list-response)
                         delete-response (dispatch/handle-worker-fetch delete-request env)]
                   (is (= 200 (.-status list-response)))
                   (is (= [{:id "pat-1"
                            :graph-id "graph-1"
                            :graph-name "Graph 1"
                            :token-prefix "logseq_pat_abcd"
                            :permission "read"
                            :created-at 10
                            :expires-at 20
                            :last-used-at nil}]
                          (:tokens list-body)))
                   (is (not (string/includes? (js/JSON.stringify (clj->js list-body)) "must-not-leak")))
                   (is (= 204 (.-status delete-response)))
                   (let [{:keys [sql args]} (last @sql-calls)]
                     (is (and (string? sql)
                              (string/includes? (string/lower-case sql) "delete from personal_access_tokens")))
                     (is (= ["pat-1" "user-1"] args)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(defn- pat-row [permission expires-at]
  {"id" "pat-1"
   "user_id" "user-1"
   "graph_id" "graph-1"
   "token_prefix" "logseq_pat_scope"
   "permission" permission
   "created_at" 10
   "expires_at" expires-at
   "last_used_at" nil})

(defn- with-pat-query-results [permission expires-at]
  (fn [_ sql & _args]
    (let [sql (string/lower-case sql)]
      (cond
        (string/includes? sql "from personal_access_tokens")
        (p/resolved (d1-results [(pat-row permission expires-at)]))

        (string/includes? sql "union select graph_id from graph_members")
        (p/resolved (d1-results [{"graph_id" "graph-1"}]))

        (string/includes? sql "graph_e2ee")
        (p/resolved (d1-results [{"graph_e2ee" 0}]))

        :else
        (p/resolved (d1-results []))))))

(defn- pat-semantic-request [method graph-id token]
  (js/Request. (str "http://localhost/api/v1/graphs/" graph-id "/pages")
               #js {:method method
                    :headers #js {"authorization" (str "Bearer " token)
                                  "content-type" "application/json"}
                    :body (when (= method "POST") "{\"title\":\"Page\"}")}))

(deftest pat-semantic-api-enforces-read-write-and-both-permissions-test
  (async done
         (let [now 1700000000000
               forwarded (atom [])
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter true (atom []))
                        "SEMANTIC_WRITE_RATE_LIMITER" (rate-limiter true (atom []))}
               request (fn [method token]
                         (pat-semantic-request method "graph-1" token))
               run (fn [permission method token]
                     (p/with-redefs [common/now-ms (fn [] now)
                                     common/<d1-all (with-pat-query-results
                                                      permission (+ now 10000))
                                     common/<d1-run (fn [& _] (p/resolved #js {:success true}))]
                       (dispatch/handle-worker-fetch (request method token) env)))]
           (-> (p/let [read-get (run "read" "GET" "logseq_pat_read")
                       read-post (run "read" "POST" "logseq_pat_read_post")
                       write-get (run "write" "GET" "logseq_pat_write_get")
                       write-post (run "write" "POST" "logseq_pat_write")
                       both-get (run "both" "GET" "logseq_pat_both_get")
                       both-post (run "both" "POST" "logseq_pat_both_post")]
                 (is (= 200 (.-status read-get)))
                 (is (= 403 (.-status read-post)))
                 (is (= 403 (.-status write-get)))
                 (is (= 200 (.-status write-post)))
                 (is (= 200 (.-status both-get)))
                 (is (= 200 (.-status both-post))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-semantic-api-rejects-wrong-graph-and-expired-token-test
  (async done
         (let [now 1700000000000
               forwarded (atom [])
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (capturing-do-namespace forwarded)
                        "SEMANTIC_READ_RATE_LIMITER" (rate-limiter true (atom []))}]
           (-> (p/with-redefs [common/now-ms (fn [] now)
                               common/<d1-run (fn [& _] (p/resolved #js {:success true}))]
                 (p/let [wrong-graph
                         (p/with-redefs [common/<d1-all
                                         (with-pat-query-results "read" (+ now 10000))]
                           (dispatch/handle-worker-fetch
                            (pat-semantic-request "GET" "graph-2" "logseq_pat_wrong_graph") env))
                         expired
                         (p/with-redefs [common/<d1-all
                                         (with-pat-query-results "read" now)]
                           (dispatch/handle-worker-fetch
                            (pat-semantic-request "GET" "graph-1" "logseq_pat_expired") env))]
                   (is (= 403 (.-status wrong-graph)))
                   (is (= 401 (.-status expired)))
                   (is (empty? @forwarded))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest pat-is-not-accepted-by-raw-sync-route-test
  (async done
         (let [request (js/Request. "http://localhost/sync/graph-1/snapshot/download"
                                    #js {:headers #js {"authorization" "Bearer logseq_pat_raw_sync"}})
               env #js {"DB" #js {}
                        "LOGSEQ_SYNC_DO" (make-do-namespace)}]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_ _]
                                 (p/rejected (ex-info "invalid" {})))]
                 (p/let [response (dispatch/handle-worker-fetch request env)]
                   (is (= 401 (.-status response)))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
