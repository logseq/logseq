(ns logseq.db-sync.agent-runtime-provider-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.agent.runtime-provider :as runtime-provider]))

(deftest provider-kind-test
  (testing "normalizes configured runtime provider"
    (is (= "sprites" (runtime-provider/provider-kind #js {})))
    (is (= "sprites" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "SPRITES"})))
    (is (= "local-dev" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-DEV"})))))

(deftest fill-template-test
  (testing "fills sandbox id placeholders"
    (is (= "/sandboxes/sbx-1/commands"
           (runtime-provider/fill-template "/sandboxes/{sandbox_id}/commands" "sbx-1")))
    (is (= "https://sbx-1.agent.internal"
           (runtime-provider/fill-template "https://{sandbox_id}.agent.internal" "sbx-1")))))

(deftest runtime-provider-resolution-test
  (testing "prefers runtime provider, falls back to env provider"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "cloudflare"}]
      (is (= "local-dev"
             (runtime-provider/runtime-provider-kind env {:provider "local-dev"})))
      (is (= "sprites"
             (runtime-provider/runtime-provider-kind env {:provider "sprites"})))
      (is (= "cloudflare"
             (runtime-provider/runtime-provider-kind env {:provider "cloudflare"}))))))
