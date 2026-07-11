(ns logseq.db-sync.worker.dispatch
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.asset-link :as asset-link]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]
            [promesa.core :as p]))

(defn- admin-token-valid?
  [request ^js env]
  (let [expected (aget env "DB_SYNC_ADMIN_TOKEN")
        actual (.get (.-headers request) "x-db-sync-admin-token")]
    (and (string? expected)
         (seq expected)
         (= expected actual))))

(defn- forward-sync-request
  [request ^js env graph-id ^js new-url]
  (let [^js namespace (.-LOGSEQ_SYNC_DO env)
        do-id (.idFromName namespace graph-id)
        stub (.get namespace do-id)]
    (if (common/upgrade-request? request)
      (.fetch stub request)
      (do
        (.set (.-searchParams new-url) "graph-id" graph-id)
        (let [rewritten (platform/request (.toString new-url) request)]
          (.fetch stub rewritten))))))

(defn- scopes [claims]
  (-> (or (some-> claims (aget "scope")) "")
      (string/split #"\s+")
      set))

(defn- forward-semantic-request [request ^js env {:keys [internal-path path-params]} ^js url]
  (let [graph-id (:graph-id path-params)
        path (reduce-kv (fn [result k value]
                          (string/replace result (str ":" (name k)) value))
                        internal-path
                        path-params)
        target (js/URL. (str (.-origin url) path (.-search url)))]
    (.set (.-searchParams target) "graph-id" graph-id)
    (forward-sync-request request env graph-id target)))

(defn- rate-limit-response []
  (js/Response. (js/JSON.stringify #js {:error "rate limit exceeded"})
                #js {:status 429
                     :headers #js {"content-type" "application/json"
                                   "retry-after" "60"}}))

(defn- handle-semantic-request [request ^js env ^js url operation]
  (p/let [claims (auth/auth-claims request env)]
    (cond
      (nil? claims) (http/unauthorized)
      (not (contains? (scopes claims) (:scope operation))) (http/error-response "insufficient scope" 403)
      :else
      (let [graph-id (get-in operation [:path-params :graph-id])]
        (p/let [access (index-handler/graph-access-response request env graph-id)]
          (if-not (.-ok access)
            access
            (p/let [e2ee? (index/<graph-e2ee? (aget env "DB") graph-id)]
              (cond
                (nil? e2ee?) (http/not-found)
                e2ee? (http/error-response "semantic-api-unavailable-for-e2ee" 409)
                :else
                (let [binding-name (if (= :read (:rate-class operation))
                                     "SEMANTIC_READ_RATE_LIMITER"
                                     "SEMANTIC_WRITE_RATE_LIMITER")
                      ^js limiter (aget env binding-name)]
                  (if-not limiter
                    (http/error-response "rate limiter unavailable" 503)
                    (p/let [result (.limit limiter #js {:key (str (aget claims "sub") ":"
                                                               (:operation-id operation) ":" graph-id)})]
                      (if (false? (aget result "success"))
                        (rate-limit-response)
                        (forward-semantic-request request env operation url)))))))))))))

(defn- request-user-id
  [request]
  (let [token (auth/token-from-request request)
        claims (when (string? token)
                 (auth/unsafe-jwt-claims token))
        user-id (some-> claims (aget "sub"))]
    (when (string? user-id)
      user-id)))

(defn- <safe-touch-activity!
  [request ^js env graph-id]
  (let [db (aget env "DB")
        user-id (request-user-id request)]
    (if (and db (string? graph-id))
      (try
        (-> (p/let [_ (index/<graph-activity-touch! db graph-id)
                    _ (when (string? user-id)
                        (index/<user-activity-touch! db user-id))]
              nil)
            (p/catch (fn [error]
                       (log/warn :db-sync/activity-touch-failed
                                 {:graph-id graph-id
                                  :user-id user-id
                                  :error error})
                       nil)))
        (catch :default error
          (log/warn :db-sync/activity-touch-failed
                    {:graph-id graph-id
                     :user-id user-id
                     :error error})
          (p/resolved nil)))
      (p/resolved nil))))

(defn handle-worker-fetch [request ^js env]
  (->
   (p/do
     (let [url (platform/request-url request)
           path (.-pathname url)
           method (.-method request)]
       (cond
         (= path "/health")
         (http/json-response :worker/health {:ok true})

         (= path "/openapi.json")
         (http/json-response nil (semantic-routes/openapi-document (or (aget env "COGNITO_ISSUER") "")))

         (semantic-routes/match-public method path)
         (handle-semantic-request request env url (semantic-routes/match-public method path))

         (or (= path "/graphs")
             (string/starts-with? path "/graphs/"))
         (index-handler/handle-fetch #js {:env env :d1 (aget env "DB")} request)

         (string/starts-with? path "/admin/graphs/")
         (index-handler/handle-fetch #js {:env env :d1 (aget env "DB")} request)

         (string/starts-with? path "/e2ee")
         (index-handler/handle-fetch #js {:env env :d1 (aget env "DB")} request)

         (string/starts-with? path "/assets/")
         (if (= method "OPTIONS")
           (assets-handler/handle request env)
           (if-let [{:keys [graph-id]} (assets-handler/parse-asset-path path)]
             (if (admin-token-valid? request env)
               (assets-handler/handle request env)
               (p/let [signed? (if (= method "GET") (asset-link/<valid-request? request env) false)]
                 (if signed?
                   (assets-handler/handle request env)
                   (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
                     (if (.-ok access-resp)
                       (assets-handler/handle request env)
                       access-resp)))))
             (http/bad-request "invalid asset path")))

         (= method "OPTIONS")
         (common/options-response)

         (string/starts-with? path "/sync/")
         (let [prefix (count "/sync/")
               rest-path (subs path prefix)
               rest-path (if (string/starts-with? rest-path "/")
                           (subs rest-path 1)
                           rest-path)
               slash-idx (or (string/index-of rest-path "/") -1)
               graph-id (if (neg? slash-idx) rest-path (subs rest-path 0 slash-idx))
               tail (if (neg? slash-idx)
                      "/"
                      (subs rest-path slash-idx))
               new-url (js/URL. (str (.-origin url) tail (.-search url)))]
           (if (seq graph-id)
               (if (= method "OPTIONS")
                 (common/options-response)
                 (if (admin-token-valid? request env)
                   (forward-sync-request request env graph-id new-url)
                   (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
                     (if (.-ok access-resp)
                       (p/let [response (forward-sync-request request env graph-id new-url)
                               _ (when (< (.-status response) 400)
                                   (<safe-touch-activity! request env graph-id))]
                         response)
                       access-resp))))
             (http/bad-request "missing graph id")))

         :else
         (http/not-found))))
   (p/catch (fn [error]
              (let [err-type (str (type error))
                    message (try (.-message error) (catch :default _ nil))
                    data (try (ex-data error) (catch :default _ nil))
                    stack (try (.-stack error) (catch :default _ nil))
                    json-str (try (js/JSON.stringify error) (catch :default _ nil))]
                (common/json-response
                 {:error "dispatch error"
                  :debug-type err-type
                  :debug-message message
                  :debug-data (when data (pr-str data))
                  :debug-json json-str
                  :debug-stack stack}
                 500))))))
