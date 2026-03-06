(ns logseq.agents.e2b-runtime-provider-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.runtime-provider :as runtime-provider]))

(deftest e2b-default-provider-kind-test
  (testing "e2b is the default and supports explicit normalization"
    (is (= "e2b" (runtime-provider/provider-kind #js {})))
    (is (= "e2b" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "E2B"})))
    (is (= "e2b" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "unknown"})))))

(deftest e2b-provider-dispatch-test
  (testing "create-provider and resolve-provider dispatch e2b"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "e2b"}]
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "e2b"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "unknown"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "e2b"}))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env nil)))))))

(deftest e2b-terminal-supported-test
  (testing "e2b runtime supports browser terminal"
    (is (true? (runtime-provider/runtime-terminal-supported? {:provider "e2b"})))))

(deftest e2b-provider-provision-test
  (async done
         (let [calls (atom [])
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))]
           (aset sandbox-class "create"
                 (fn [& args]
                   (let [opts (js->clj (last args) :keywordize-keys true)]
                     (is (= "e2b-key" (:apiKey opts)))
                     (is (= "pause" (get-in opts [:lifecycle :onTimeout])))
                     (js/Promise.resolve
                      #js {:sandboxId "e2b-sbx-1"
                           :getHost (fn [port]
                                      (swap! calls conj {:type :host :port port})
                                      "https://e2b-agent.local")
                           :commands
                           #js {:run (fn [cmd _opts]
                                       (swap! calls conj {:type :command :cmd cmd})
                                       (if (string/includes? cmd "/v1/health")
                                         (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                  :stderr ""
                                                                  :exitCode 0})
                                         (js/Promise.resolve #js {:stdout ""
                                                                  :stderr ""
                                                                  :exitCode 0})))}}))))
           (set! js/fetch
                 (fn [request]
                   (is (= "POST" (.-method request)))
                   (is (= "https://e2b-agent.local/v1/sessions/sess-e2b-1" (.-url request)))
                   (is (= "Bearer agent-token"
                          (.get (.-headers request) "authorization")))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-1" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "e2b" (:provider runtime)))
                        (is (= "e2b-sbx-1" (:sandbox-id runtime)))
                        (is (= "https://e2b-agent.local" (:base-url runtime)))
                        (is (= "sess-e2b-1" (:session-id runtime)))
                        (is (= 2468 (:sandbox-port runtime)))
                        (is (some #(= {:type :host :port 2468} %) @calls))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-open-terminal-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               runtime {:provider "e2b"
                        :sandbox-id "e2b-sbx-1"
                        :base-url "https://e2b-agent.local"
                        :session-id "sess-term-1"}
               request (js/Request. "https://api.logseq.local/sessions/sess-term-1/terminal?cols=120&rows=40"
                                    #js {:method "GET"})
               calls (atom {})
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [req]
                   (reset! calls {:url (.-url req)
                                  :method (.-method req)
                                  :auth (.get (.-headers req) "authorization")})
                   (js/Promise.resolve (js/Response. "ok" #js {:status 200}))))
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [resp]
                        (set! js/fetch original-fetch)
                        (is (= 200 (.-status resp)))
                        (is (= "GET" (:method @calls)))
                        (is (= "Bearer agent-token" (:auth @calls)))
                        (is (= "https://e2b-agent.local/v1/sessions/sess-term-1/terminal?cols=120&rows=40"
                               (:url @calls)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-snapshot-runtime-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"}
               provider (runtime-provider/create-provider env "e2b")
               runtime {:provider "e2b"
                        :sandbox-id "e2b-sbx-1"
                        :session-id "sess-e2b-snapshot"
                        :backup-dir "/workspace/sess-e2b-snapshot"}
               task {:project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-connect (aget sandbox-class "connect")
               restore! (fn []
                          (aset sandbox-class "connect" original-connect))]
           (aset sandbox-class "connect"
                 (fn [_sandbox-id _opts]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-1"
                         :createSnapshot (fn []
                                           (js/Promise.resolve #js {:snapshotId "e2b-snap-1"}))})))
           (-> (runtime-provider/<snapshot-runtime! provider runtime {:task task})
               (.then (fn [result]
                        (restore!)
                        (is (= "e2b" (:provider result)))
                        (is (= "e2b-snap-1" (:snapshot-id result)))
                        (is (= "/workspace/sess-e2b-snapshot" (:backup-dir result)))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-export-workspace-bundle-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"}
               provider (runtime-provider/create-provider env "e2b")
               runtime {:provider "e2b"
                        :sandbox-id "e2b-sbx-1"
                        :backup-dir "/workspace/sess-e2b-bundle"
                        :session-id "sess-e2b-bundle"}
               task {:project {:base-branch "main"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-connect (aget sandbox-class "connect")
               restore! (fn []
                          (aset sandbox-class "connect" original-connect))]
           (aset sandbox-class "connect"
                 (fn [_sandbox-id _opts]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-1"
                         :commands
                         #js {:run (fn [_cmd _opts]
                                     (js/Promise.resolve
                                      #js {:stdout (str "__BUNDLE_HEAD__:abc123\n"
                                                        "__BUNDLE_BASE__:base123\n"
                                                        "__BUNDLE_BYTES__:16\n"
                                                        "__BUNDLE_SHA256__:sha256-123\n"
                                                        "__BUNDLE_BRANCH__:feat/m24\n"
                                                        "__BUNDLE_DATA__:ZmFrZS1idW5kbGUtZGF0YQ==\n")
                                           :stderr ""
                                           :exitCode 0}))}})))
           (-> (runtime-provider/<export-workspace-bundle! provider runtime {:task task})
               (.then (fn [result]
                        (restore!)
                        (is (= "abc123" (:head-sha result)))
                        (is (= "base123" (:base-sha result)))
                        (is (= 16 (:byte-size result)))
                        (is (= "sha256-123" (:checksum result)))
                        (is (= "feat/m24" (:head-branch result)))
                        (is (= "ZmFrZS1idW5kbGUtZGF0YQ==" (:bundle-base64 result)))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))
