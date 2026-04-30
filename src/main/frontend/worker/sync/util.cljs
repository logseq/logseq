(ns frontend.worker.sync.util
  "Helpers for sync"
  (:require [lambdaisland.glogi :as log]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.common.util :as common-util]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [promesa.core :as p]))

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
  (let [state @worker-state/*state]
    (or (:auth/id-token state)
        (:auth/access-token state))))

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

(def ^:private invalid-coerce ::invalid-coerce)

(defn coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn coerce-http-response [schema-key body]
  (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :response})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- auth-headers []
  (let [token (auth-token)]
    (when (nil? token)
      (throw (ex-info "Empty token" {})))
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(defn fetch-json
  [url opts {:keys [response-schema error-schema] :or {error-schema :error}}]
  (p/let [resp (js/fetch url (clj->js (with-auth-headers opts)))
          text (.text resp)
          data (when (seq text) (js/JSON.parse text))]
    (if (.-ok resp)
      (let [body (js->clj data :keywordize-keys true)
            body (if response-schema
                   (coerce-http-response response-schema body)
                   body)]
        (if (or (nil? response-schema) body)
          body
          (throw (ex-info "db-sync invalid response"
                          {:status (.-status resp)
                           :url url
                           :body body}))))
      (let [body (when data (js->clj data :keywordize-keys true))
            body (if error-schema
                   (coerce-http-response error-schema body)
                   body)]
        (throw (ex-info "db-sync request failed"
                        {:status (.-status resp)
                         :url url
                         :body body}))))))
