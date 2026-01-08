(ns frontend.handler.db-based.worker-sync
  "Worker-sync handler based on Cloudflare Durable Objects."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- ws->http-base [ws-url]
  (when (string? ws-url)
    (let [base (cond
                 (string/starts-with? ws-url "wss://")
                 (str "https://" (subs ws-url (count "wss://")))

                 (string/starts-with? ws-url "ws://")
                 (str "http://" (subs ws-url (count "ws://")))

                 :else ws-url)
          base (string/replace base #"/sync/%s$" "")]
      base)))

(defn- http-base []
  (or config/worker-sync-http-base
      (ws->http-base config/worker-sync-ws-url)))

(def ^:private snapshot-rows-limit 2000)

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(defn- fetch-json
  [url opts]
  (p/let [resp (js/fetch url (clj->js (with-auth-headers opts)))
          text (.text resp)
          data (when (seq text) (js/JSON.parse text))]
    (if (.-ok resp)
      data
      (throw (ex-info "worker-sync request failed"
                      {:status (.-status resp)
                       :url url
                       :body data})))))

(defn <rtc-start!
  [repo & {:keys [_stop-before-start?] :as _opts}]
  (log/info :worker-sync/start {:repo repo})
  (state/<invoke-db-worker :thread-api/worker-sync-start repo))

(defn <rtc-stop!
  []
  (log/info :worker-sync/stop true)
  (state/<invoke-db-worker :thread-api/worker-sync-stop))

(defn <rtc-get-users-info
  []
  (p/resolved nil))

(defn <rtc-create-graph!
  [repo]
  (let [schema-version (some-> (ldb/get-graph-schema-version (db/get-db)) :major str)
        base (http-base)]
    (if base
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              result (fetch-json (str base "/graphs")
                                 {:method "POST"
                                  :headers {"content-type" "application/json"}
                                  :body (js/JSON.stringify
                                         #js {:graph_name (string/replace repo config/db-version-prefix "")
                                              :schema_version schema-version})})
              graph-id (aget result "graph_id")]
        (if graph-id
          (p/do!
           (ldb/transact! repo [(sqlite-util/kv :logseq.kv/db-type "db")
                                (sqlite-util/kv :logseq.kv/graph-uuid (uuid graph-id))])
           graph-id)
          (p/rejected (ex-info "worker-sync missing graph id in create response"
                               {:type :worker-sync/invalid-graph
                                :response result}))))
      (p/rejected (ex-info "worker-sync missing graph info"
                           {:type :worker-sync/invalid-graph
                            :base base})))))

(defn <rtc-delete-graph!
  [graph-uuid _schema-version]
  (let [base (http-base)]
    (if (and graph-uuid base)
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)]
        (fetch-json (str base "/graphs/" graph-uuid) {:method "DELETE"}))
      (p/rejected (ex-info "worker-sync missing graph id"
                           {:type :worker-sync/invalid-graph
                            :graph-uuid graph-uuid
                            :base base})))))

(defn <rtc-download-graph!
  [graph-name graph-uuid _graph-schema-version]
  (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
  (let [base (http-base)]
    (-> (if (and graph-uuid base)
          (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
                  graph (str config/db-version-prefix graph-name)]
            (p/loop [after -1           ; root addr is 0
                     first-batch? true]
              (p/let [resp (fetch-json (str base "/sync/" graph-uuid "/snapshot/rows"
                                            "?after=" after "&limit=" snapshot-rows-limit)
                                       {:method "GET"})
                      rows (js->clj (aget resp "rows") :keywordize-keys true)
                      done? (true? (aget resp "done"))
                      last-addr (or (aget resp "last_addr") after)]
                (p/do!
                 (state/<invoke-db-worker :thread-api/worker-sync-import-kvs-rows
                                          graph rows first-batch?)
                 (if done?
                   (state/<invoke-db-worker :thread-api/worker-sync-finalize-kvs-import graph)
                   (p/recur last-addr false))))))
          (p/rejected (ex-info "worker-sync missing graph info"
                               {:type :worker-sync/invalid-graph
                                :graph-uuid graph-uuid
                                :base base})))
        (p/catch (fn [error]
                   (throw error)))
        (p/finally
          (fn []
            (state/set-state! :rtc/downloading-graph-uuid nil))))))

(defn <get-remote-graphs
  []
  (let [base (http-base)]
    (if-not base
      (p/resolved [])
      (-> (p/let [_ (state/set-state! :rtc/loading-graphs? true)
                  _ (js/Promise. user-handler/task--ensure-id&access-token)
                  resp (fetch-json (str base "/graphs") {:method "GET"})
                  graphs (js->clj (aget resp "graphs") :keywordize-keys true)
                  result (mapv (fn [graph]
                                 (merge
                                  {:url (str config/db-version-prefix (:graph_name graph))
                                   :GraphName (:graph_name graph)
                                   :GraphSchemaVersion (:schema_version graph)
                                   :GraphUUID (:graph_id graph)
                                   :rtc-graph? true}
                                  (dissoc graph :graph_id :graph_name :schema_version)))
                               graphs)]
            (state/set-state! :rtc/graphs result)
            (repo-handler/refresh-repos!)
            result)
          (p/finally
            (fn []
              (state/set-state! :rtc/loading-graphs? false)))))))
