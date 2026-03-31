(ns frontend.worker.sync.util
  "Helpers for sync"
  (:require [lambdaisland.glogi :as log]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.common.util :as common-util]))

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn cli-node-owner?
  []
  (try
    (let [env (:env (platform/current))]
      (and (= :node (:runtime env))
           (= :cli (:owner-source env))))
    (catch :default _ false)))

(defn auth-token
  []
  (let [cli-owner? (cli-node-owner?)
        configured-token (:auth-token @worker-state/*db-sync-config)]
    (if cli-owner?
      configured-token
      (or (worker-state/get-id-token)
          configured-token))))

(defn get-graph-id
  [repo]
  (or (when-let [conn (worker-state/get-datascript-conn repo)]
        (let [db @conn
              graph-uuid (ldb/get-graph-rtc-uuid db)]
          (when graph-uuid
            (str graph-uuid))))
      (some-> (client-op/get-graph-uuid repo) str)))

(defn require-auth-token!
  [context]
  (when-not (seq (auth-token))
    (fail-fast :db-sync/missing-field (assoc context :field :auth-token))))

(defn- ex-message->code
  [message]
  (when (and (string? message)
             (re-matches #"[a-zA-Z0-9._/\-]+" message))
    (keyword message)))

(defn- error->diagnostic
  [error]
  (let [data (or (ex-data error) {})
        code (or (:code data)
                 (ex-message->code (ex-message error))
                 :exception)]
    {:code code
     :message (or (ex-message error) (str error))
     :at (common-util/time-ms)
     :data (when (seq data) data)}))

(defn set-last-sync-error!
  [client error]
  (when-let [*last-error (:last-sync-error client)]
    (reset! *last-error (error->diagnostic error))))

(defn clear-last-sync-error!
  [client]
  (when-let [*last-error (:last-sync-error client)]
    (reset! *last-error nil)))
