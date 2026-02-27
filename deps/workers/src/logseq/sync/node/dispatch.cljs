(ns logseq.sync.node.dispatch
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [logseq.sync.node.graph :as graph]
            [logseq.sync.node.routes :as node-routes]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.handler.assets :as assets-handler]
            [logseq.sync.worker.handler.index :as index-handler]
            [logseq.sync.worker.handler.sync :as sync-handler]
            [logseq.sync.worker.http :as http]
            [promesa.core :as p]))

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

      (string/starts-with? path "/assets/")
      (if (= method "OPTIONS")
        (assets-handler/handle request env)
        (if-let [{:keys [graph-id]} (assets-handler/parse-asset-path path)]
          (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
            (if (.-ok access-resp)
              (assets-handler/handle request env)
              access-resp))
          (http/bad-request "invalid asset path")))

      (= method "OPTIONS")
      (common/options-response)

      (string/starts-with? path "/sync/")
      (if-let [{:keys [graph-id tail]} (node-routes/parse-sync-path path)]
        (if (seq graph-id)
          (if (= method "OPTIONS")
            (common/options-response)
            (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
              (if (.-ok access-resp)
                (let [ctx (graph/get-or-create-graph registry deps graph-id)
                      new-url (js/URL. (str (.-origin url) tail (.-search url)))]
                  (.set (.-searchParams new-url) "graph-id" graph-id)
                  (let [rewritten (platform/request (.toString new-url) request)]
                    (sync-handler/handle-http ctx rewritten)))
                access-resp)))
          (http/bad-request "missing graph id"))
        (http/bad-request "missing graph id"))

      :else
      (http/not-found))))
