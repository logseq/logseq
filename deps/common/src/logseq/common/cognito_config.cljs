(ns logseq.common.cognito-config
  "Shared Cognito configuration for frontend and CLI-safe consumers."
  (:require [clojure.string :as string]))

(goog-define ENABLE-FILE-SYNC-PRODUCTION false)

(def ^:private prod-login-url
  "https://logseq-prod.auth.us-east-1.amazoncognito.com/login?client_id=3c7np6bjtb4r1k1bi9i049ops5&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")

(def ^:private test-login-url
  "https://logseq-test2.auth.us-east-2.amazoncognito.com/login?client_id=3ji1a0059hspovjq5fhed3uil8&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")

(def LOGIN-URL
  (if ENABLE-FILE-SYNC-PRODUCTION
    prod-login-url
    test-login-url))

(def COGNITO-CLIENT-ID
  (or (some-> (js/URL. LOGIN-URL)
              .-searchParams
              (.get "client_id"))
      (if ENABLE-FILE-SYNC-PRODUCTION
        "69cs1lgme7p8kbgld8n5kseii6"
        "1qi1uijg8b6ra70nejvbptis0q")))

(def CLI-COGNITO-CLIENT-ID
  (if ENABLE-FILE-SYNC-PRODUCTION
    "69cs1lgme7p8kbgld8n5kseii6"
    "1qi1uijg8b6ra70nejvbptis0q"))

(def OAUTH-DOMAIN
  (if ENABLE-FILE-SYNC-PRODUCTION
    "logseq-prod.auth.us-east-1.amazoncognito.com"
    "logseq-test2.auth.us-east-2.amazoncognito.com"))

(def OAUTH-SCOPE
  (or (some-> (js/URL. LOGIN-URL)
              .-searchParams
              (.get "scope")
              (string/replace #"\+" " "))
      "email openid phone"))
