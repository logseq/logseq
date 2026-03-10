(ns logseq.agents.managed-auth
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [promesa.core :as p]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-int
  [value default-value]
  (let [parsed (if (number? value)
                 value
                 (some-> value str js/parseInt))]
    (if (and (number? parsed)
             (not (js/isNaN parsed)))
      parsed
      default-value)))

(defn- db-binding
  [^js env]
  (aget env "AGENTS_DB"))

(defn- decode-jwt-payload
  [token]
  (when (string? token)
    (try
      (let [parts (string/split token #"\.")
            payload (second parts)]
        (when (string? payload)
          (let [normalized (-> payload
                               (string/replace "-" "+")
                               (string/replace "_" "/"))
                pad-len (mod (- 4 (mod (count normalized) 4)) 4)
                padded (str normalized (apply str (repeat pad-len "=")))
                decoded (js/atob padded)]
            (js->clj (js/JSON.parse decoded)))))
      (catch :default _
        nil))))

(defn- token-account-id
  [{:keys [id-token access-token account-id]}]
  (or (non-empty-str account-id)
      (some-> (decode-jwt-payload id-token)
              (get "https://api.openai.com/auth")
              (get "chatgpt_account_id")
              non-empty-str)
      (some-> (decode-jwt-payload access-token)
              (get "https://api.openai.com/auth")
              (get "chatgpt_account_id")
              non-empty-str)))

(defn- token-response->auth-json
  [{:keys [access-token refresh-token id-token token-type expires-in expires-at scope account-id]}]
  (js/JSON.stringify
   (clj->js
    {:auth_mode "chatgpt"
     :OPENAI_API_KEY nil
     :tokens (cond-> {}
               (string? id-token) (assoc :id_token id-token)
               (string? access-token) (assoc :access_token access-token)
               (string? refresh-token) (assoc :refresh_token refresh-token)
               (string? (non-empty-str account-id)) (assoc :account_id account-id)
               (string? token-type) (assoc :token_type token-type)
               (number? expires-in) (assoc :expires_in expires-in)
               (number? expires-at) (assoc :expires_at expires-at)
               (string? scope) (assoc :scope scope))
     :last_refresh (.toISOString (js/Date.))})))

(defn- ->oauth-state
  [row]
  (when row
    (let [state (aget row "state")
          user-id (aget row "user_id")
          code-verifier (aget row "code_verifier")
          redirect-to (aget row "redirect_to")
          created-at (normalize-int (aget row "created_at") 0)
          expires-at (normalize-int (aget row "expires_at") 0)]
      (when (and (string? state)
                 (string? user-id)
                 (string? code-verifier)
                 (string? redirect-to))
        {:state state
         :user-id user-id
         :code-verifier code-verifier
         :redirect-to redirect-to
         :created-at created-at
         :expires-at expires-at}))))

(defn- row->managed-auth
  [row]
  (when row
    (let [auth-id (aget row "auth_id")
          user-id (aget row "user_id")
          provider (or (non-empty-str (aget row "provider")) "openai")
          auth-method (or (non-empty-str (aget row "auth_method")) "chatgpt")
          access-token (non-empty-str (aget row "access_token"))
          refresh-token (non-empty-str (aget row "refresh_token"))
          id-token (non-empty-str (aget row "id_token"))
          token-type (non-empty-str (aget row "token_type"))
          scope (non-empty-str (aget row "scope"))
          issued-at (normalize-int (aget row "issued_at") 0)
          expires-at (normalize-int (aget row "expires_at") 0)
          revoked-at (normalize-int (aget row "revoked_at") 0)
          now (common/now-ms)
          auth-state (cond
                       (pos? revoked-at) "revoked"
                       (and (pos? expires-at) (<= expires-at now)) "expired"
                       :else "valid")
          token-payload {:access-token access-token
                         :refresh-token refresh-token
                         :id-token id-token
                         :token-type token-type
                         :scope scope
                         :account-id (token-account-id {:id-token id-token
                                                        :access-token access-token})
                         :issued-at issued-at
                         :expires-at expires-at}
          auth-json (token-response->auth-json token-payload)]
      (when (and (string? auth-id)
                 (string? user-id))
        (cond-> {:auth-id auth-id
                 :auth-state auth-state
                 :auth-method auth-method
                 :user-id user-id
                 :issued-at issued-at
                 :runtime-auth-payload {:auth-json auth-json}}
          (string? provider) (assoc :provider provider)
          (pos? expires-at) (assoc :expires-at expires-at)
          (pos? revoked-at) (assoc :revoked-at revoked-at))))))

(defn- normalize-token-response
  [payload]
  (let [issued-at (common/now-ms)
        expires-in (normalize-int (:expires_in payload) 0)
        provided-expires-at (normalize-int (:expires_at payload) 0)
        expires-at (cond
                     (pos? provided-expires-at) provided-expires-at
                     (pos? expires-in) (+ issued-at (* expires-in 1000))
                     :else 0)]
    {:access-token (non-empty-str (:access_token payload))
     :refresh-token (non-empty-str (:refresh_token payload))
     :id-token (non-empty-str (:id_token payload))
     :token-type (non-empty-str (:token_type payload))
     :scope (non-empty-str (:scope payload))
     :account-id (non-empty-str (:account_id payload))
     :expires-in expires-in
     :issued-at issued-at
     :expires-at expires-at}))

(defn- <upsert-managed-auth!
  [^js env user-id token-payload]
  (if-let [db (db-binding env)]
    (let [auth-id (str (random-uuid))
          provider "openai"
          auth-method "chatgpt"
          now (common/now-ms)
          expires-at (normalize-int (:expires-at token-payload) 0)]
      (p/let [_ (common/<d1-run db
                                (str "insert into managed_auth_sessions "
                                     "(auth_id, user_id, provider, auth_method, access_token, refresh_token, id_token, token_type, scope, issued_at, expires_at, created_at, updated_at, revoked_at) "
                                     "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null) "
                                     "on conflict(user_id, provider, auth_method) do update set "
                                     "auth_id = excluded.auth_id, "
                                     "access_token = excluded.access_token, "
                                     "refresh_token = excluded.refresh_token, "
                                     "id_token = excluded.id_token, "
                                     "token_type = excluded.token_type, "
                                     "scope = excluded.scope, "
                                     "issued_at = excluded.issued_at, "
                                     "expires_at = excluded.expires_at, "
                                     "updated_at = excluded.updated_at, "
                                     "revoked_at = null")
                                auth-id
                                user-id
                                provider
                                auth-method
                                (:access-token token-payload)
                                (:refresh-token token-payload)
                                (:id-token token-payload)
                                (:token-type token-payload)
                                (:scope token-payload)
                                (:issued-at token-payload)
                                expires-at
                                now
                                now)]
        {:auth-id auth-id
         :user-id user-id
         :provider provider
         :auth-method auth-method
         :auth-state "valid"
         :issued-at (:issued-at token-payload)
         :expires-at expires-at
         :runtime-auth-payload {:auth-json (token-response->auth-json token-payload)}}))
    (p/rejected (ex-info "managed auth storage unavailable" {:reason :missing-agents-db}))))

(defn <import-credentials!
  [^js env user-id credentials]
  (if-not (string? (some-> user-id non-empty-str))
    (p/rejected (ex-info "missing user id" {:reason :missing-user-id}))
    (let [token-payload (normalize-token-response credentials)]
      (if-not (string? (:access-token token-payload))
        (p/rejected (ex-info "missing access token" {:reason :missing-access-token}))
        (<upsert-managed-auth! env user-id token-payload)))))

(defn <get-active-managed-auth-for-user!
  [^js env user-id]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (p/let [result (common/<d1-all db
                                     (str "select auth_id, user_id, provider, auth_method, access_token, refresh_token, id_token, token_type, scope, "
                                          "issued_at, expires_at, revoked_at "
                                          "from managed_auth_sessions "
                                          "where user_id = ? and provider = 'openai' and auth_method = 'chatgpt' "
                                          "order by updated_at desc limit 1")
                                     user-id)
              rows (common/get-sql-rows result)]
        (row->managed-auth (first rows)))
      (p/resolved nil))
    (p/resolved nil)))
