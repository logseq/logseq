(ns logseq.melange.bridge.common.authorization
  "JWT verification through the default Melange Common API."
  (:require ["@logseq/melange-js-api/common" :as melange-common]))

(def ^:private authorization (.-Authorization melange-common))

(defn verify-jwt
  [token env]
  (.verifyJwtDefault authorization
                     token
                     (aget env "COGNITO_ISSUER")
                     (aget env "COGNITO_CLIENT_ID")
                     (aget env "COGNITO_JWKS_URL")))
