;; src/test/memo/ai/provider_test.cljs
(ns memo.ai.provider-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.ai.provider :as provider]))

(deftest test-provider-config
  (testing "loads provider configuration"
    (is (some? (provider/get-config :ollama)))))