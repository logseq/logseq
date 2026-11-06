(ns logseq.db-sync.worker.auth
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [promesa.core :as p]))

(def personal-access-token-prefix "logseq_pat_")
(def oauth-access-token-prefix "logseq_oat_")
(def ^:private rtc-groups #{"team" "rtc_2025_07_10"})
(def ^:private user-info-url "https://api.logseq.com/file-sync/user_info")

(defn- bearer-token [auth-header]
  (when (and (string? auth-header) (string/starts-with? auth-header "Bearer "))
    (subs auth-header 7)))

(defn token-from-request [request]
  (or (bearer-token (.get (.-headers request) "authorization"))
      (let [url (js/URL. (.-url request))]
        (.get (.-searchParams url) "token"))))

(defn- decode-jwt-part [part]
  (let [pad (if (pos? (mod (count part) 4))
              (apply str (repeat (- 4 (mod (count part) 4)) "="))
              "")
        base64 (-> (str part pad)
                   (string/replace "-" "+")
                   (string/replace "_" "/"))
        raw (js/atob base64)]
    (js/JSON.parse raw)))

(defn unsafe-jwt-claims [token]
  (try
    (when (string? token)
      (let [parts (string/split token #"\.")]
        (when (= 3 (count parts))
          (decode-jwt-part (nth parts 1)))))
    (catch :default _
      nil)))

(def ^:private recoverable-auth-errors
  #{"invalid" "iss not found" "aud not found" "exp" "kid"})

(def ^:private truthy-env-values
  #{"1" "true" "yes" "on"})

(defn- recoverable-auth-error?
  [error]
  (when error
    (let [message (or (ex-message error) (some-> error .-message))]
      (contains? recoverable-auth-errors message))))

(defn- env-flag-enabled?
  [env k]
  (let [v (some-> env (aget k))]
    (cond
      (true? v) true
      (false? v) false
      (string? v) (contains? truthy-env-values (string/lower-case v))
      :else false)))

(defn- allow-unverified-jwt-claims?
  [env]
  (env-flag-enabled? env "DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS"))

(defn- expired-token?
  [token]
  (when-let [claims (unsafe-jwt-claims token)]
    (let [exp (aget claims "exp")
          now-s (js/Math.floor (/ (.now js/Date) 1000))]
      (and (number? exp)
           (<= exp now-s)))))

(defn auth-claims [request env]
  (let [token (token-from-request request)]
    (if (string? token)
      (if (expired-token? token)
        (p/resolved nil)
        (-> (authorization/verify-jwt token env)
            (p/catch (fn [error]
                       (cond
                         (recoverable-auth-error? error)
                         nil

                         (allow-unverified-jwt-claims? env)
                         (unsafe-jwt-claims token)

                         :else
                         (p/rejected error))))))
      (p/resolved nil))))

(defn personal-access-token?
  [token]
  (and (string? token)
       (string/starts-with? token personal-access-token-prefix)))

(defn oauth-access-token?
  [token]
  (and (string? token)
       (string/starts-with? token oauth-access-token-prefix)))

(defn- claims-groups
  [claims]
  (let [groups (some-> claims (aget "cognito:groups"))]
    (cond
      (array? groups) (set (array-seq groups))
      (string? groups) (->> (string/split groups #"[\[\]\s,\"]+")
                            (remove string/blank?)
                            set)
      :else #{})))

(defn <rtc-user?
  "True when the login JWT belongs to a sync group that can manage API credentials."
  [request claims]
  (let [claim-groups (claims-groups claims)]
    (if (seq claim-groups)
      (p/resolved (boolean (seq (set/intersection rtc-groups claim-groups))))
      (-> (p/let [token (token-from-request request)
                  response (js/fetch user-info-url
                                     #js {:method "POST"
                                          :headers #js {"authorization" (str "Bearer " token)
                                                        "content-type" "application/json"}
                                          :body "{}"})
                  user-info (when (.-ok response) (.json response))
                  user-groups (claims-groups
                               #js {"cognito:groups" (some-> user-info (aget "UserGroups"))})]
            (boolean (seq (set/intersection rtc-groups user-groups))))
          (p/catch (fn [_] false))))))

(defn <sha-256-hex
  [value]
  (p/let [payload (.encode (js/TextEncoder.) value)
          digest (.digest (.-subtle js/crypto) "SHA-256" payload)]
    (->> (array-seq (js/Uint8Array. digest))
         (map (fn [octet]
                (.padStart (.toString octet 16) 2 "0")))
         (apply str))))

(defn- permission->scope
  [permission]
  (case permission
    "read" "logseq/read"
    "write" "logseq/write"
    "both" "logseq/read logseq/write"
    nil))

(defn- bound-credential-claims
  [{:keys [id user-id graph-id scope expires-at]}]
  (when (and (string? user-id)
             (string? graph-id)
             (string? scope)
             (number? expires-at)
             (> expires-at (common/now-ms)))
    #js {"sub" user-id
         "scope" scope
         "pat_id" id
         "pat_graph_id" graph-id}))

(defn semantic-auth-claims
  [request env]
  (let [token (token-from-request request)
        db (aget env "DB")]
    (cond
      (personal-access-token? token)
      (if db
        (p/let [token-hash (<sha-256-hex token)
                pat (index/<personal-access-token-by-hash db token-hash)
                scope (some-> pat :permission permission->scope)]
          (bound-credential-claims (assoc pat :scope scope)))
        (p/resolved nil))

      (oauth-access-token? token)
      (if db
        (p/let [token-hash (<sha-256-hex token)
                oauth-token (index/<oauth-access-token-by-hash db token-hash)]
          (when (= "approved" (:app-status oauth-token))
            (bound-credential-claims oauth-token)))
        (p/resolved nil))

      :else
      (auth-claims request env))))
