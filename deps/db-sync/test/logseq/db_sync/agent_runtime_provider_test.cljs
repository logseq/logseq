(ns logseq.db-sync.agent-runtime-provider-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.agent.runtime-provider :as runtime-provider]))

(deftest provider-kind-test
  (testing "normalizes configured runtime provider"
    (is (= "local-dev" (runtime-provider/provider-kind #js {})))
    (is (= "local-dev" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL"})))
    (is (= "cloudflare-sandbox"
           (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "cloudflare-sandbox"})))
    (is (= "fly-io"
           (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "fly-io"})))))

(deftest fill-template-test
  (testing "fills sandbox id placeholders"
    (is (= "/sandboxes/sbx-1/commands"
           (runtime-provider/fill-template "/sandboxes/{sandbox_id}/commands" "sbx-1")))
    (is (= "https://sbx-1.agent.internal"
           (runtime-provider/fill-template "https://{sandbox_id}.agent.internal" "sbx-1")))))

(deftest runtime-provider-resolution-test
  (testing "prefers runtime provider, falls back to env provider"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "cloudflare-sandbox"}]
      (is (= "cloudflare-sandbox"
             (runtime-provider/runtime-provider-kind env nil)))
      (is (= "local-dev"
             (runtime-provider/runtime-provider-kind env {:provider "local-dev"})))
      (is (= "cloudflare-sandbox"
             (runtime-provider/runtime-provider-kind env {:provider "cloudflare"}))))))
