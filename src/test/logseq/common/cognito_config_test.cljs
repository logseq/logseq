(ns logseq.common.cognito-config-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.config :as config]
            [logseq.common.cognito-config :as cognito-config]))

(deftest test-shared-cognito-config-matches-frontend-config
  (is (= config/COGNITO-CLIENT-ID cognito-config/COGNITO-CLIENT-ID))
  (is (= config/OAUTH-DOMAIN cognito-config/OAUTH-DOMAIN)))
