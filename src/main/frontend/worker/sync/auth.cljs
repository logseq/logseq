(ns frontend.worker.sync.auth
  "Auth and endpoint helpers for db sync."
  (:require [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(defn ws-base-url
  [db-sync-config]
  (:ws-url db-sync-config))

(defn http-base-url
  [db-sync-config]
  (or (:http-base db-sync-config)
      (when-let [ws-url (ws-base-url db-sync-config)]
        (let [base (cond
                     (string/starts-with? ws-url "wss://")
                     (str "https://" (subs ws-url (count "wss://")))

                     (string/starts-with? ws-url "ws://")
                     (str "http://" (subs ws-url (count "ws://")))

                     :else ws-url)]
          (string/replace base #"/sync/%s$" "")))))

(defn id-token-expired?
  [token]
  (if-not (string? token)
    true
    (try
      (let [exp-ms (some-> token worker-util/parse-jwt :exp (* 1000))]
        (or (not (number? exp-ms))
            (<= exp-ms (common-util/time-ms))))
      (catch :default _
        true))))

(defn <resolve-ws-token
  [{:keys [auth-token-f id-token-expired?-f invoke-main-thread-f set-id-token-f]}]
  (let [token (auth-token-f)]
    (if (id-token-expired?-f token)
      (p/let [resp (invoke-main-thread-f)
              refreshed-token (:id-token resp)]
        (when (string? refreshed-token)
          (set-id-token-f refreshed-token)
          refreshed-token))
      (p/resolved token))))

(defn get-user-uuid
  [id-token]
  (some-> id-token
          worker-util/parse-jwt
          :sub))

(defn auth-headers
  [token]
  (when-let [token* token]
    {"authorization" (str "Bearer " token*)}))

(defn with-auth-headers
  [auth-headers-f opts]
  (if-let [auth (auth-headers-f)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))
