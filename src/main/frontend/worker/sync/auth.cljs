(ns frontend.worker.sync.auth
  "Auth and endpoint helpers for db sync."
  (:require [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.util :as sync-util]
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

(defn oauth-token-url
  [state]
  (or (:auth/oauth-token-url state)
      (when-let [domain (not-empty (:auth/oauth-domain state))]
        (str "https://" domain "/oauth2/token"))))

(defn <refresh-id&access-token
  []
  (let [state @worker-state/*state
        refresh-token (:auth/refresh-token state)
        token-url (oauth-token-url state)
        oauth-client-id (:auth/oauth-client-id state)]
    (when-not (seq refresh-token)
      (throw (ex-info "worker auth refresh requires refresh token"
                      {:code :missing-refresh-token})))
    (when-not (seq token-url)
      (throw (ex-info "worker auth refresh requires oauth token url"
                      {:code :missing-oauth-token-url})))
    (when-not (seq oauth-client-id)
      (throw (ex-info "worker auth refresh requires oauth client id"
                      {:code :missing-oauth-client-id})))
    (let [form-data (js/URLSearchParams.)]
      (.set form-data "grant_type" "refresh_token")
      (.set form-data "client_id" oauth-client-id)
      (.set form-data "refresh_token" refresh-token)
      (p/let [resp (js/fetch token-url #js {:method "POST"
                                            :headers #js {"content-type" "application/x-www-form-urlencoded"}
                                            :body (.toString form-data)})
              text (.text resp)
              data (when (seq text)
                     (js->clj (js/JSON.parse text) :keywordize-keys true))]
        (if (.-ok resp)
          {:id-token (:id_token data)
           :access-token (:access_token data)}
          (throw (ex-info "worker auth refresh failed"
                          {:code :auth-refresh-failed
                           :status (.-status resp)
                           :token-url token-url
                           :body data})))))))

(defn <resolve-ws-token
  []
  (let [token (sync-util/auth-token)
        token-expired? (id-token-expired? token)]
    (if (and (not (sync-util/cli-node-owner?)) token-expired?)
      (p/let [{:keys [id-token access-token]} (<refresh-id&access-token)]
        (when-not (seq id-token)
          (throw (ex-info "worker auth refresh returned empty id-token"
                          {:code :auth-refresh-empty-id-token})))
        (worker-state/set-new-state!
         (cond-> {:auth/id-token id-token}
           (seq access-token) (assoc :auth/access-token access-token)))
        id-token)
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
