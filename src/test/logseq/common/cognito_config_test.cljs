(ns logseq.common.cognito-config-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.config :as config]
            [logseq.common.cognito-config :as cognito-config]
            ["fs" :as fs]))

(deftest test-shared-cognito-config-matches-frontend-config
  (is (= config/LOGIN-URL cognito-config/LOGIN-URL))
  (is (= config/COGNITO-CLIENT-ID cognito-config/COGNITO-CLIENT-ID))
  (is (= config/OAUTH-DOMAIN cognito-config/OAUTH-DOMAIN)))

(deftest test-logseq-cli-build-enables-prod-file-sync-by-default
  (let [shadow-config (.toString (fs/readFileSync "shadow-cljs.edn") "utf8")]
    (is (re-find #"(?s):logseq-cli\s+\{:target :node-script.*?logseq\.common\.cognito-config/ENABLE-FILE-SYNC-PRODUCTION #shadow/env \[\"ENABLE_FILE_SYNC_PRODUCTION\" :as :bool :default true\]"
                 shadow-config))))
