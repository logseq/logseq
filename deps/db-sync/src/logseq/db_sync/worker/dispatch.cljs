(ns logseq.db-sync.worker.dispatch
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(defn handle-worker-fetch [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= path "/health")
      (http/json-response :worker/health {:ok true})

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (index-handler/handle-fetch #js {:env env :d1 (aget env "DB")} request)

      (string/starts-with? path "/e2ee")
      (index-handler/handle-fetch #js {:env env :d1 (aget env "DB")} request)

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
            (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
              (if (.-ok access-resp)
                (let [^js namespace (.-LOGSEQ_SYNC_DO env)
                      do-id (.idFromName namespace graph-id)
                      stub (.get namespace do-id)]
                  (if (common/upgrade-request? request)
                    (.fetch stub request)
                    (do
                      (.set (.-searchParams new-url) "graph-id" graph-id)
                      (let [rewritten (js/Request. (.toString new-url) request)]
                        (.fetch stub rewritten)))))
                access-resp)))
          (http/bad-request "missing graph id")))

      :else
      (http/not-found))))
