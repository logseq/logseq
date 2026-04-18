(ns logseq.db-sync.worker.dispatch
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.http :as http]
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

(defn handle-worker-fetch [request ^js env]
  (->
   (p/do
     (let [url (platform/request-url request)
           path (.-pathname url)
           method (.-method request)]
       (cond
         (= path "/health")
         (http/json-response :worker/health {:ok true})

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
               (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
                 (if (.-ok access-resp)
                   (assets-handler/handle request env)
                   access-resp)))
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
                     (forward-sync-request request env graph-id new-url)
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
