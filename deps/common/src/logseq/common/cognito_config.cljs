(ns logseq.common.cognito-config
  "Shared Cognito configuration for frontend and CLI-safe consumers.")

(goog-define ENABLE-FILE-SYNC-PRODUCTION false)

(def COGNITO-CLIENT-ID
  (if ENABLE-FILE-SYNC-PRODUCTION
    "69cs1lgme7p8kbgld8n5kseii6"
    "1qi1uijg8b6ra70nejvbptis0q"))

(def CLI-COGNITO-CLIENT-ID
  (if ENABLE-FILE-SYNC-PRODUCTION
    "69cs1lgme7p8kbgld8n5kseii6"
    "1qi1uijg8b6ra70nejvbptis0q"))

(def OAUTH-DOMAIN
  (if ENABLE-FILE-SYNC-PRODUCTION
    "logseq-prod.auth.us-east-1.amazoncognito.com"
    "logseq-test2.auth.us-east-2.amazoncognito.com"))

(def OAUTH-SCOPE "email openid phone")
