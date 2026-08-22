(ns logseq.db-sync.node.dispatch
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.node.graph :as graph]
            [logseq.db-sync.node.routes :as node-routes]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.asset-link :as asset-link]
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

(defn- handle-semantic-request
  [request env registry deps ^js url operation]
  (let [graph-id (get-in operation [:path-params :graph-id])]
    (if-not (and (seq graph-id) (:internal-path operation))
      (http/not-found)
      (p/let [access-response (index-handler/graph-access-response request env graph-id)]
        (if-not (.-ok access-response)
          access-response
          (p/let [e2ee? (index/<graph-e2ee? (aget env "DB") graph-id)]
            (cond
              (nil? e2ee?) (http/not-found)
              e2ee? (http/error-response "semantic-api-unavailable-for-e2ee" 409)
              :else
              (let [path (reduce-kv (fn [result key value]
                                      (string/replace result (str ":" (name key)) value))
                                    (:internal-path operation)
                                    (:path-params operation))
                    target (js/URL. (str (.-origin url) path (.-search url)))
                    _ (.set (.-searchParams target) "graph-id" graph-id)
                    context (graph/get-or-create-graph registry deps graph-id)
                    forwarded (platform/request (.toString target) request)]
                (sync-handler/handle-http context forwarded)))))))))

(defn handle-node-fetch
  [{:keys [request env registry deps]}]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)
        semantic-operation (semantic-routes/match-public method path)
        index-self #js {:env env :d1 (aget env "DB")}]
    (cond
      (= path "/health")
      (http/json-response :worker/health {:ok true})

      semantic-operation
      (handle-semantic-request request env registry deps url semantic-operation)

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (index-handler/handle-fetch index-self request)

      (string/starts-with? path "/e2ee")
      (index-handler/handle-fetch index-self request)

      (string/starts-with? path "/assets/")
      (if (= method "OPTIONS")
        (assets-handler/handle request env)
        (if-let [{:keys [graph-id]} (assets-handler/parse-asset-path path)]
          (if (admin-token-valid? request env)
            (assets-handler/handle request env)
            (p/let [signed? (if (= method "GET")
                              (asset-link/<valid-request? request env)
                              false)]
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
      (if-let [{:keys [graph-id tail]} (node-routes/parse-sync-path path)]
        (if (seq graph-id)
          (if (= method "OPTIONS")
            (common/options-response)
            (if (admin-token-valid? request env)
              (let [ctx (graph/get-or-create-graph registry deps graph-id)
                    new-url (js/URL. (str (.-origin url) tail (.-search url)))]
                (.set (.-searchParams new-url) "graph-id" graph-id)
                (let [rewritten (platform/request (.toString new-url) request)]
                  (sync-handler/handle-http ctx rewritten)))
              (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
                (if (.-ok access-resp)
                  (let [ctx (graph/get-or-create-graph registry deps graph-id)
                        new-url (js/URL. (str (.-origin url) tail (.-search url)))]
                    (.set (.-searchParams new-url) "graph-id" graph-id)
                    (let [rewritten (platform/request (.toString new-url) request)]
                      (sync-handler/handle-http ctx rewritten)))
                  access-resp))))
          (http/bad-request "missing graph id"))
        (http/bad-request "missing graph id"))

      :else
      (http/not-found))))
