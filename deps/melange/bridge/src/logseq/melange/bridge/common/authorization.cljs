(ns logseq.melange.bridge.common.authorization
  "JWT verification through the default Melange Common API."
  (:require ["@logseq/melange-js-api/common" :as melange-common]
            [clojure.string :as string]))

(def ^:private authorization (.-Authorization melange-common))

(defn- allowed-client-ids
  [env]
  (let [primary-client-id (aget env "COGNITO_CLIENT_ID")]
    (cond-> (->> (string/split (or (aget env "COGNITO_CLIENT_IDS") "") #",")
                 (map string/trim)
                 (remove string/blank?)
                 set)
      (and (string? primary-client-id) (not (string/blank? primary-client-id)))
      (conj primary-client-id))))

(defn client-id-allowed?
  [env client-id]
  (and (string? client-id)
       (not (string/blank? client-id))
       (contains? (allowed-client-ids env) client-id)))

(defn verify-jwt
  [token env]
  (.verifyJwtDefault authorization
                     token
                     (aget env "COGNITO_ISSUER")
                     (string/join "," (allowed-client-ids env))
                     (aget env "COGNITO_JWKS_URL")))
