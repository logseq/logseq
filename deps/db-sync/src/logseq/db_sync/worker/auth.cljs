(ns logseq.db-sync.worker.auth
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [promesa.core :as p]))

(def personal-access-token-prefix "logseq_pat_")

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

(def ^:private truthy-env-values
  #{"1" "true" "yes" "on"})

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

(defn- jwks-unavailable-error?
  [error]
  (= "jwks" (or (ex-message error) (some-> error .-message))))

(defn- claims-scopes
  [claims]
  (-> (or (some-> claims (aget "scope")) "")
      (string/split #"\s+")
      set))

(defn- additional-client-ids
  "The Cognito client ids beyond the primary (app) client: the third-party
  clients allowed on the semantic API surface."
  [env]
  (let [primary (aget env "COGNITO_CLIENT_ID")]
    (->> (string/split (or (aget env "COGNITO_CLIENT_IDS") "") #",")
         (map string/trim)
         (remove string/blank?)
         (remove #(= % primary))
         set)))

(defn third-party-oauth-token?
  "True for tokens granted to third-party OAuth clients — the semantic API
  surface (`/api/v1/graphs/...`): any token carrying a `logseq/*` scope, or
  issued to one of the additional Cognito client ids. Such a token must not
  reach the native sync surface (`/sync`, `/graphs`, `/e2ee`, assets, PATs).
  Deciding from unverified claims is safe because the check only rejects: a
  forged claims payload breaks the signature verification that follows.
  PAT claims (which carry a `pat_id` and their own scope) are not affected."
  [claims env]
  (boolean
   (when (and claims (nil? (aget claims "pat_id")))
     (or (some #(string/starts-with? % "logseq/") (claims-scopes claims))
         (contains? (additional-client-ids env)
                    (or (aget claims "aud") (aget claims "client_id")))))))

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
        ;; The verification runs inside a promise callback so that a
        ;; synchronous throw (for example `atob` on a malformed header part)
        ;; is caught here exactly like a rejection. The catch handler returns
        ;; `false` rather than nil and the result is normalized below: promesa
        ;; resolves nil through a shared singleton promise whose task queue a
        ;; concurrently throwing task can poison, re-leaking the error.
        (-> (p/resolved nil)
            (p/then (fn [_] (authorization/verify-jwt token env)))
            (p/catch (fn [error]
                       (cond
                         ;; Testing escape hatch: during a JWKS outage the token's
                         ;; claims are trusted without verification. Only the
                         ;; "jwks" error (the keys could not be reached) qualifies;
                         ;; every other failure — malformed token, bad signature,
                         ;; wrong issuer or audience — rejects the token.
                         (and (allow-unverified-jwt-claims? env)
                              (jwks-unavailable-error? error))
                         (unsafe-jwt-claims token)

                         ;; A JWKS outage is a server fault, not the client's:
                         ;; it keeps propagating. Every other verification
                         ;; failure means this token is not acceptable.
                         (jwks-unavailable-error? error)
                         (p/rejected error)

                         :else
                         (do (log/warn :db-sync/auth-claims-failed {:error (str error)})
                             false))))
            (p/then (fn [claims] (if (false? claims) nil claims)))))
      (p/resolved nil))))

(defn personal-access-token?
  [token]
  (and (string? token)
       (string/starts-with? token personal-access-token-prefix)))

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

(defn semantic-auth-claims
  [request env]
  (let [token (token-from-request request)]
    (if (personal-access-token? token)
      (if-let [db (aget env "DB")]
        (p/let [token-hash (<sha-256-hex token)
                pat (index/<personal-access-token-by-hash db token-hash)
                scope (some-> pat :permission permission->scope)]
          (when (and pat
                     scope
                     (> (:expires-at pat) (common/now-ms)))
            #js {"sub" (:user-id pat)
                 "scope" scope
                 "pat_id" (:id pat)
                 "pat_graph_id" (:graph-id pat)}))
        (p/resolved nil))
      (auth-claims request env))))
