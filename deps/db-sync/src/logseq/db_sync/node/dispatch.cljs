(ns logseq.db-sync.node.dispatch
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.node.graph :as graph]
            [logseq.db-sync.node.routes :as node-routes]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.semantic :as semantic-routes]
            [promesa.core :as p]))

(defn- admin-token-valid?
  [request env]
  (let [expected (aget env "DB_SYNC_ADMIN_TOKEN")
        actual (.get (.-headers request) "x-db-sync-admin-token")]
    (and (string? expected)
         (seq expected)
         (= expected actual))))

(defn- forward-sync-request
  [request registry deps graph-id tail url]
  (let [ctx (graph/get-or-create-graph registry deps graph-id)
        new-url (js/URL. (str (.-origin url) tail (.-search url)))]
    (.set (.-searchParams new-url) "graph-id" graph-id)
    (sync-handler/handle-http ctx (platform/request (.toString new-url) request))))

(defn- scopes [claims]
  (-> (or (some-> claims (aget "scope")) "")
      (string/split #"\s+")
      set))

(defn- rewrite-semantic-url [url operation graph-id e2ee?]
  (let [path (reduce-kv (fn [result k value]
                          (string/replace result (str ":" (name k)) (str value)))
                        (:internal-path operation)
                        (or (:path-params operation) {}))
        target (js/URL. (str (.-origin url) path (.-search url)))]
    (.set (.-searchParams target) "graph-id" graph-id)
    (.set (.-searchParams target) "graph-e2ee" (str (true? e2ee?)))
    target))

(defn- handle-node-graphs-list [env url claims]
  (let [name (.get (.-searchParams url) "name")
        cursor (.get (.-searchParams url) "cursor")
        pat-graph-id (aget claims "pat_graph_id")]
    (if (string? pat-graph-id)
      (p/let [graph (index/<semantic-graph-get
                     (aget env "DB") (aget claims "sub") pat-graph-id)
              graph (when (and graph
                               (or (nil? name)
                                   (= (string/lower-case name)
                                      (string/lower-case (:graph-name graph)))))
                      graph)]
        (http/json-response nil {:graphs (cond-> [] graph (conj graph))}))
      (p/let [result (index/<semantic-graphs-list
                      (aget env "DB")
                      (aget claims "sub")
                      {:name name :limit 50 :cursor cursor})]
        (http/json-response nil result)))))

(defn- handle-node-semantic [request env registry deps url operation]
  (p/let [claims (auth/semantic-auth-claims request env)]
    (cond
      (nil? claims)
      (http/unauthorized)

      (not (contains? (scopes claims) (:scope operation)))
      (http/error-response "insufficient scope" 403)

      (= :semantic/graphs-list (:handler operation))
      (handle-node-graphs-list env url claims)

      :else
      (let [graph-id (get-in operation [:path-params :graph-id])
            pat-graph-id (aget claims "pat_graph_id")]
        (p/let [access (cond
                         (and (string? pat-graph-id) (not= pat-graph-id graph-id))
                         (http/forbidden)

                         :else
                         (index-handler/graph-access-response request env graph-id))]
          (if-not (.-ok access)
            access
            (p/let [e2ee? (index/<graph-e2ee? (aget env "DB") graph-id)]
              (cond
                (nil? e2ee?)
                (http/not-found)

                (and e2ee? (not (:e2ee-safe-write? operation)))
                (http/error-response "semantic-api-unavailable-for-e2ee" 409)

                :else
                (let [target (rewrite-semantic-url url operation graph-id e2ee?)
                      ctx (graph/get-or-create-graph registry deps graph-id)
                      rewritten (platform/request (.toString target) request)]
                  (sync-handler/handle-http ctx rewritten))))))))))

(defn handle-node-fetch
  [{:keys [request env registry deps]}]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)
        index-self #js {:env env :d1 (aget env "DB")}]
    (cond
      (= path "/health")
      (http/json-response :worker/health {:ok true})

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (index-handler/handle-fetch index-self request)

      (string/starts-with? path "/e2ee")
      (index-handler/handle-fetch index-self request)

      (semantic-routes/match-public method path)
      (handle-node-semantic request env registry deps url
                            (semantic-routes/match-public method path))

      (string/starts-with? path "/assets/")
      (if (= method "OPTIONS")
        (assets-handler/handle request env)
        (if-let [{:keys [graph-id]} (assets-handler/parse-asset-path path)]
          (if (admin-token-valid? request env)
            (assets-handler/handle request env)
            (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
              (if (.-ok access-resp)
                (assets-handler/handle request env)
                access-resp)))
          (http/bad-request "invalid asset path")))

      (= method "OPTIONS")
      (common/options-response)

      (string/starts-with? path "/sync/")
      (if-let [{:keys [graph-id tail]} (node-routes/parse-sync-path path)]
        (if (seq graph-id)
          (if (= method "OPTIONS")
            (common/options-response)
            (cond
              (admin-token-valid? request env)
              (forward-sync-request request registry deps graph-id tail url)

              :else
              (p/let [access-response (index-handler/graph-access-response request env graph-id)]
                (if (.-ok access-response)
                  (forward-sync-request request registry deps graph-id tail url)
                  access-response))))
          (http/bad-request "missing graph id"))
        (http/bad-request "missing graph id"))

      :else
      (http/not-found))))
