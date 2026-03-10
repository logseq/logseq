(ns logseq.agents.m25-managed-auth-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.request :as request]
            [logseq.agents.runtime-provider :as runtime-provider]
            [logseq.sync.worker.http :as http]))

(def ^:private managed-auth-json
  "{\"auth_mode\":\"chatgpt\",\"OPENAI_API_KEY\":null,\"tokens\":{\"access_token\":\"managed-token\",\"refresh_token\":\"managed-refresh\",\"account_id\":\"account-1\"},\"last_refresh\":\"2026-03-09T00:00:00.000Z\"}")

(defn- bootstrap-auth-json [commands]
  (when-let [bootstrap-cmd (some #(when (string/includes? % "nohup sandbox-agent server") %) commands)]
    (when-let [[_ encoded] (re-find #"printf \"%s\" \"([^\"]+)\" \| base64 -d > ~/.codex/auth\.json" bootstrap-cmd)]
      (js/atob encoded))))

(deftest sessions-create-managed-auth-coerce-test
  (testing "accepts managed ChatGPT auth session metadata in sessions/create"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments []
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent {:provider "codex"
                        :managed-auth {:auth-id "managed-1"
                                       :auth-state "valid"
                                       :auth-method "chatgpt"
                                       :user-id "user-1"
                                       :workspace-id "workspace-1"
                                       :issued-at 1000
                                       :expires-at 2000
                                       :runtime-auth-payload {:auth-json managed-auth-json}}}}
          coerced (http/coerce-http-request :sessions/create body)]
      (is (= body coerced)))))

(deftest normalize-session-create-managed-auth-test
  (testing "preserves managed auth metadata on normalized agent tasks"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments ["https://example.com/a.png"]
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent {:provider "codex"
                        :managed-auth {:auth-id "managed-1"
                                       :auth-state "valid"
                                       :auth-method "chatgpt"
                                       :runtime-auth-payload {:auth-json managed-auth-json}}
                        :auth-json "{\"tokens\":{\"access_token\":\"legacy-token\"}}"}}]
      (is (= {:provider "codex"
              :managed-auth {:auth-id "managed-1"
                             :auth-state "valid"
                             :auth-method "chatgpt"
                             :runtime-auth-payload {:auth-json managed-auth-json}}
              :auth-json "{\"tokens\":{\"access_token\":\"legacy-token\"}}"}
             (:agent (request/normalize-session-create body)))))))

(deftest e2b-provider-provision-materializes-managed-auth-payload-test
  (async done
         (let [calls (atom [])
               health-checks (atom 0)
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"
                             :managed-auth {:auth-id "managed-1"
                                            :auth-state "valid"
                                            :auth-method "chatgpt"
                                            :runtime-auth-payload {:auth-json managed-auth-json}}}
                     :project {:repo-url "https://github.com/logseq/agent-test"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))]
           (aset sandbox-class "create"
                 (fn [& _args]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-managed-auth"
                         :getHost (fn [_port]
                                    "https://e2b-agent.local")
                         :commands
                         #js {:run (fn [cmd _opts]
                                     (swap! calls conj cmd)
                                     (if (string/includes? cmd "/v1/health")
                                       (do
                                         (swap! health-checks inc)
                                         (if (= 1 @health-checks)
                                           (js/Promise.resolve #js {:stdout ""
                                                                    :stderr "connection refused"
                                                                    :exitCode 1})
                                           (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                    :stderr ""
                                                                    :exitCode 0})))
                                       (js/Promise.resolve #js {:stdout ""
                                                                :stderr ""
                                                                :exitCode 0})))}})))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-managed-auth" task)
               (.then (fn [_runtime]
                        (restore!)
                        (let [auth-json (bootstrap-auth-json @calls)]
                          (is (= managed-auth-json auth-json))
                          (is (string/includes? auth-json "\"auth_mode\":\"chatgpt\""))
                          (is (string/includes? auth-json "\"account_id\":\"account-1\""))))
                      (done)))
           (.catch (fn [error]
                     (restore!)
                     (is false (str "unexpected error: " error))
                     (done))))))

(deftest e2b-provider-provision-prefers-managed-auth-over-legacy-auth-json-test
  (async done
         (let [calls (atom [])
               health-checks (atom 0)
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"
                             :managed-auth {:auth-id "managed-1"
                                            :auth-state "valid"
                                            :auth-method "chatgpt"
                                            :runtime-auth-payload {:auth-json managed-auth-json}}
                             :auth-json "{\"tokens\":{\"access_token\":\"legacy-token\"}}"}
                     :project {:repo-url "https://github.com/logseq/agent-test"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))]
           (aset sandbox-class "create"
                 (fn [& _args]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-managed-auth"
                         :getHost (fn [_port]
                                    "https://e2b-agent.local")
                         :commands
                         #js {:run (fn [cmd _opts]
                                     (swap! calls conj cmd)
                                     (if (string/includes? cmd "/v1/health")
                                       (do
                                         (swap! health-checks inc)
                                         (if (= 1 @health-checks)
                                           (js/Promise.resolve #js {:stdout ""
                                                                    :stderr "connection refused"
                                                                    :exitCode 1})
                                           (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                    :stderr ""
                                                                    :exitCode 0})))
                                       (js/Promise.resolve #js {:stdout ""
                                                                :stderr ""
                                                                :exitCode 0})))}})))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-managed-auth" task)
               (.then (fn [_runtime]
                        (restore!)
                        (let [auth-json (bootstrap-auth-json @calls)]
                          (is (= managed-auth-json auth-json))
                          (is (string/includes? auth-json "\"auth_mode\":\"chatgpt\""))
                          (is (string/includes? auth-json "\"account_id\":\"account-1\""))))
                      (done)))
           (.catch (fn [error]
                     (restore!)
                     (is false (str "unexpected error: " error))
                     (done))))))
