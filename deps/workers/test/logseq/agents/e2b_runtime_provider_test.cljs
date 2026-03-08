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
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/logseq/agent-test"}}
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
                     (is (true? (:autoPause opts)))
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
                        (is (some #(and (= :command (:type %))
                                        (string/includes? (:cmd %) "mkdir -p '/home/user/workspace'"))
                                  @calls))
                        (is (some #(and (= :command (:type %))
                                        (string/includes? (:cmd %) "'/home/user/workspace/agent-test'"))
                                  @calls))
                        (is (some #(= {:type :host :port 2468} %) @calls))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-provision-normalizes-bare-host-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}
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
                    #js {:sandboxId "e2b-sbx-2"
                         :getHost (fn [_port]
                                    "2468-if9ct9du77wx2o6oorw10.e2b.app")
                         :commands
                         #js {:run (fn [cmd _opts]
                                     (if (string/includes? cmd "/v1/health")
                                       (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                :stderr ""
                                                                :exitCode 0})
                                       (js/Promise.resolve #js {:stdout ""
                                                                :stderr ""
                                                                :exitCode 0})))}})))
           (set! js/fetch
                 (fn [request]
                   (is (= "https://2468-if9ct9du77wx2o6oorw10.e2b.app/v1/sessions/sess-e2b-2"
                          (.-url request)))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-2" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "https://2468-if9ct9du77wx2o6oorw10.e2b.app"
                               (:base-url runtime)))
                        (is (= "/home/user/workspace/agent-test"
                               (:backup-dir runtime)))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-provision-builds-template-from-project-docker-file-test
  (async done
         (let [calls (atom [])
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"
                        "E2B_TEMPLATE" "fallback-template"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/logseq/agent-test"
                               :graph-id "graph-123"
                               :docker-file "FROM node:20\nRUN corepack enable"}}
               e2b-ns (js/require "e2b")
               original-template (aget e2b-ns "Template")
               original-wait-for-timeout (aget e2b-ns "waitForTimeout")
               original-default-build-logger (aget e2b-ns "defaultBuildLogger")
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset e2b-ns "Template" original-template)
                          (aset e2b-ns "waitForTimeout" original-wait-for-timeout)
                          (aset e2b-ns "defaultBuildLogger" original-default-build-logger)
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))
               template-builder #js {}
               template-fn (fn []
                             template-builder)]
           (aset template-builder "fromDockerfile"
                 (fn [docker-file]
                   (swap! calls conj {:type :from-dockerfile
                                      :docker-file docker-file})
                   template-builder))
           (aset template-builder "setStartCmd"
                 (fn [command ready-cmd]
                   (swap! calls conj {:type :set-start-cmd
                                      :command command
                                      :ready-cmd ready-cmd})
                   template-builder))
           (aset template-fn "exists"
                 (fn [name opts]
                   (swap! calls conj {:type :exists
                                      :name name
                                      :opts (js->clj opts :keywordize-keys true)})
                   (js/Promise.resolve false)))
           (aset template-fn "build"
                 (fn [builder name opts]
                   (swap! calls conj {:type :build
                                      :builder (= builder template-builder)
                                      :name name
                                      :opts (js->clj opts :keywordize-keys true)})
                   (js/Promise.resolve #js {:templateId "tpl-from-docker"})))
           (aset e2b-ns "Template" template-fn)
           (aset e2b-ns "waitForTimeout"
                 (fn [timeout-ms]
                   (swap! calls conj {:type :wait-for-timeout
                                      :timeout-ms timeout-ms})
                   #js {:timeoutMs timeout-ms}))
           (aset e2b-ns "defaultBuildLogger"
                 (fn []
                   (swap! calls conj {:type :default-build-logger})
                   (fn [_entry] nil)))
           (aset sandbox-class "create"
                 (fn [& args]
                   (let [template (first args)
                         opts (js->clj (last args) :keywordize-keys true)]
                     (swap! calls conj {:type :create
                                        :template template
                                        :opts opts})
                     (js/Promise.resolve
                      #js {:sandboxId "e2b-sbx-docker"
                           :getHost (fn [_port]
                                      "https://e2b-agent.local")
                           :commands
                           #js {:run (fn [cmd _opts]
                                       (if (string/includes? cmd "/v1/health")
                                         (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                  :stderr ""
                                                                  :exitCode 0})
                                         (js/Promise.resolve #js {:stdout ""
                                                                  :stderr ""
                                                                  :exitCode 0})))}}))))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-docker" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "e2b" (:provider runtime)))
                        (is (= "logseq-graph-123-agent-test" (:template runtime)))
                        (is (some #(= {:type :from-dockerfile
                                       :docker-file "FROM node:20\nRUN corepack enable"} %)
                                  @calls))
                        (is (some #(and (= :set-start-cmd (:type %))
                                        (= "bash -lc 'while true; do sleep 3600; done'" (:command %)))
                                  @calls))
                        (is (some #(= {:type :wait-for-timeout
                                       :timeout-ms 5000} %)
                                  @calls))
                        (is (some #(= {:type :default-build-logger} %)
                                  @calls))
                        (is (some #(and (= :exists (:type %))
                                        (= "logseq-graph-123-agent-test" (:name %)))
                                  @calls))
                        (is (some #(and (= :build (:type %))
                                        (:builder %)
                                        (= "logseq-graph-123-agent-test" (:name %))
                                        (= "e2b-key" (get-in % [:opts :apiKey])))
                                  @calls))
                        (is (some #(and (= :create (:type %))
                                        (= "logseq-graph-123-agent-test" (:template %)))
                                  @calls))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-provision-reuses-existing-template-before-building-test
  (async done
         (let [calls (atom [])
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/logseq/agent-test"
                               :graph-id "graph-123"
                               :docker-file "FROM node:20\nRUN corepack enable"}}
               e2b-ns (js/require "e2b")
               original-template (aget e2b-ns "Template")
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset e2b-ns "Template" original-template)
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))
               template-fn (fn [] #js {})]
           (aset template-fn "exists"
                 (fn [name _opts]
                   (swap! calls conj {:type :exists
                                      :name name})
                   (js/Promise.resolve true)))
           (aset template-fn "build"
                 (fn [& _args]
                   (swap! calls conj {:type :build})
                   (js/Promise.resolve #js {:templateId "tpl-should-not-build"})))
           (aset e2b-ns "Template" template-fn)
           (aset sandbox-class "create"
                 (fn [& args]
                   (let [template (first args)]
                     (swap! calls conj {:type :create
                                        :template template})
                     (js/Promise.resolve
                      #js {:sandboxId "e2b-sbx-existing-template"
                           :getHost (fn [_port]
                                      "https://e2b-agent.local")
                           :commands
                           #js {:run (fn [cmd _opts]
                                       (if (string/includes? cmd "/v1/health")
                                         (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                  :stderr ""
                                                                  :exitCode 0})
                                         (js/Promise.resolve #js {:stdout ""
                                                                  :stderr ""
                                                                  :exitCode 0})))}}))))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-existing-template" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "logseq-graph-123-agent-test" (:template runtime)))
                        (is (some #(= {:type :exists
                                       :name "logseq-graph-123-agent-test"} %)
                                  @calls))
                        (is (nil? (some #(when (= :build (:type %)) %) @calls)))
                        (is (some #(and (= :create (:type %))
                                        (= "logseq-graph-123-agent-test" (:template %)))
                                  @calls))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-provision-falls-back-when-configured-template-is-missing-test
  (async done
         (let [calls (atom [])
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"
                        "E2B_TEMPLATE" "78fq0upgdyots2idb7fv"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/logseq/agent-test"}}
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))]
           (aset sandbox-class "create"
                 (fn [& args]
                   (swap! calls conj {:type :create
                                      :argc (count args)
                                      :template (when (= 2 (count args))
                                                  (first args))
                                      :opts (js->clj (last args) :keywordize-keys true)})
                   (if (= 2 (count args))
                     (js/Promise.reject
                      #js {:name "SandboxError"
                           :message "404: template '78fq0upgdyots2idb7fv' not found"})
                     (js/Promise.resolve
                      #js {:sandboxId "e2b-sbx-fallback-template"
                           :getHost (fn [_port]
                                      "https://e2b-agent.local")
                           :commands
                           #js {:run (fn [cmd _opts]
                                       (if (string/includes? cmd "/v1/health")
                                         (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                  :stderr ""
                                                                  :exitCode 0})
                                         (js/Promise.resolve #js {:stdout ""
                                                                  :stderr ""
                                                                  :exitCode 0})))}}))))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-fallback-template" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "e2b-sbx-fallback-template" (:sandbox-id runtime)))
                        (is (nil? (:template runtime)))
                        (is (= 2 (count @calls)))
                        (is (= {:type :create
                                :argc 2
                                :template "78fq0upgdyots2idb7fv"}
                               (select-keys (first @calls) [:type :argc :template])))
                        (is (= {:type :create
                                :argc 1
                                :template nil}
                               (select-keys (second @calls) [:type :argc :template])))
                        (is (= "e2b-key" (get-in (first @calls) [:opts :apiKey])))
                        (is (true? (get-in (first @calls) [:opts :autoPause])))
                        (is (= "pause" (get-in (first @calls) [:opts :lifecycle :onTimeout])))
                        (is (= "sess-e2b-fallback-template"
                               (get-in (first @calls) [:opts :metadata :session-id])))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-provision-rebuilds-docker-template-when-create-reports-missing-template-test
  (async done
         (let [calls (atom [])
               env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/logseq/logseq"
                               :graph-id "d86730bc-f157-4f91-808a-5b23532c51fc"
                               :docker-file "FROM node:20\nRUN corepack enable"}}
               e2b-ns (js/require "e2b")
               original-template (aget e2b-ns "Template")
               original-wait-for-timeout (aget e2b-ns "waitForTimeout")
               original-default-build-logger (aget e2b-ns "defaultBuildLogger")
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-create (aget sandbox-class "create")
               original-fetch js/fetch
               restore! (fn []
                          (aset e2b-ns "Template" original-template)
                          (aset e2b-ns "waitForTimeout" original-wait-for-timeout)
                          (aset e2b-ns "defaultBuildLogger" original-default-build-logger)
                          (aset sandbox-class "create" original-create)
                          (set! js/fetch original-fetch))
               template-builder #js {}
               template-fn (fn [] template-builder)]
           (aset template-builder "fromDockerfile"
                 (fn [docker-file]
                   (swap! calls conj {:type :from-dockerfile
                                      :docker-file docker-file})
                   template-builder))
           (aset template-builder "setStartCmd"
                 (fn [command _ready-cmd]
                   (swap! calls conj {:type :set-start-cmd
                                      :command command})
                   template-builder))
           (aset template-fn "exists"
                 (fn [name _opts]
                   (swap! calls conj {:type :exists
                                      :name name})
                   (js/Promise.resolve true)))
           (aset template-fn "build"
                 (fn [_builder name _opts]
                   (swap! calls conj {:type :build
                                      :name name})
                   (js/Promise.resolve #js {:templateId "tpl-rebuilt"})))
           (aset e2b-ns "Template" template-fn)
           (aset e2b-ns "waitForTimeout" (fn [_timeout-ms] #js {}))
           (aset e2b-ns "defaultBuildLogger" (fn [] (fn [_entry] nil)))
           (aset sandbox-class "create"
                 (fn [& args]
                   (let [template (first args)]
                     (swap! calls conj {:type :create
                                        :argc (count args)
                                        :template (when (= 2 (count args)) template)})
                     (if (= 1 (count (filter #(and (= :create (:type %))
                                                   (= "d86730bc-f157-4f91-808a-5b23532c51fc-logseq" (:template %)))
                                             @calls)))
                       (js/Promise.reject
                        #js {:name "SandboxError"
                             :message "404: template '78fq0upgdyots2idb7fv' not found"})
                       (js/Promise.resolve
                        #js {:sandboxId "e2b-sbx-rebuilt-template"
                             :getHost (fn [_port]
                                        "https://e2b-agent.local")
                             :commands
                             #js {:run (fn [cmd _opts]
                                         (if (string/includes? cmd "/v1/health")
                                           (js/Promise.resolve #js {:stdout "__HEALTH_OK__"
                                                                    :stderr ""
                                                                    :exitCode 0})
                                           (js/Promise.resolve #js {:stdout ""
                                                                    :stderr ""
                                                                    :exitCode 0})))}})))))
           (set! js/fetch
                 (fn [_request]
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-e2b-rebuild-template" task)
               (.then (fn [runtime]
                        (restore!)
                        (is (= "d86730bc-f157-4f91-808a-5b23532c51fc-logseq" (:template runtime)))
                        (is (= 1 (count (filter #(= {:type :exists
                                                     :name "d86730bc-f157-4f91-808a-5b23532c51fc-logseq"} %)
                                                @calls))))
                        (is (= 1 (count (filter #(= {:type :build
                                                     :name "d86730bc-f157-4f91-808a-5b23532c51fc-logseq"} %)
                                                @calls))))
                        (is (= 2 (count (filter #(and (= :create (:type %))
                                                      (= "d86730bc-f157-4f91-808a-5b23532c51fc-logseq" (:template %)))
                                                @calls))))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-run-shell-wraps-commandexiterror-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"}
               provider (runtime-provider/create-provider env "e2b")
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-connect (aget sandbox-class "connect")
               restore! (fn []
                          (aset sandbox-class "connect" original-connect))]
           (aset sandbox-class "connect"
                 (fn [_sandbox-id _opts]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-3"
                         :commands
                         #js {:run (fn [_cmd _opts]
                                     (js/Promise.reject
                                      #js {:name "CommandExitError"
                                           :message "CommandExitError: exit status 1"
                                           :stdout ""
                                           :stderr "fatal: repository not found"
                                           :exitCode 1}))}})))
           (-> (runtime-provider/<snapshot-runtime! provider
                                                    {:provider "e2b"
                                                     :sandbox-id "e2b-sbx-3"
                                                     :session-id "sess-e2b-error"
                                                     :backup-dir "/home/user/workspace/agent-test"}
                                                    {:task {:project {:repo-url "https://github.com/logseq/agent-test"
                                                                      :base-branch "main"}}})
               (.then (fn [_result]
                        (restore!)
                        (is false "expected command failure")
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is (= :e2b-command-failed (:reason (ex-data error))))
                         (is (= 1 (:exit-code (ex-data error))))
                         (is (= "fatal: repository not found" (:stderr (ex-data error))))
                         (is (string/includes? (:message (ex-data error)) "exit status 1"))
                         (done)))))))

(deftest e2b-provider-open-terminal-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"
                        "SANDBOX_AGENT_TOKEN" "agent-token"}
               provider (runtime-provider/create-provider env "e2b")
               runtime {:provider "e2b"
                        :sandbox-id "e2b-sbx-1"
                        :base-url "https://e2b-agent.local"
                        :session-id "sess-term-1"
                        :backup-dir "/home/user/workspace/agent-test"}
               request (js/Request. "https://api.logseq.local/sessions/sess-term-1/terminal?cols=120&rows=40"
                                    #js {:method "GET"})
               calls (atom {})
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-connect (aget sandbox-class "connect")
               original-websocket-pair js/WebSocketPair
               client-socket #js {}
               server-socket #js {:accept (fn [] (swap! calls assoc :accepted true))
                                  :send (fn [payload] (swap! calls assoc :ready payload))
                                  :addEventListener (fn [_type _listener] nil)
                                  :close (fn [& _args] nil)}
               restore! (fn []
                          (aset sandbox-class "connect" original-connect)
                          (set! js/WebSocketPair original-websocket-pair))]
           (set! js/WebSocketPair
                 (fn []
                   (clj->js [client-socket server-socket])))
           (aset sandbox-class "connect"
                 (fn [_sandbox-id _opts]
                   (js/Promise.resolve
                    #js {:sandboxId "e2b-sbx-1"
                         :pty
                         #js {:create (fn [opts]
                                        (swap! calls assoc :pty-opts (js->clj opts :keywordize-keys true))
                                        (js/Promise.resolve
                                         #js {:pid 42
                                              :kill (fn []
                                                      (swap! calls update :kills (fnil inc 0))
                                                      (js/Promise.resolve true))}))}})))
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [resp]
                        (restore!)
                        (is (= 101 (.-status resp)))
                        (is (= client-socket (aget resp "webSocket")))
                        (is (true? (:accepted @calls)))
                        (is (= 120 (get-in @calls [:pty-opts :cols])))
                        (is (= 40 (get-in @calls [:pty-opts :rows])))
                        (is (= "/home/user/workspace/agent-test" (get-in @calls [:pty-opts :cwd])))
                        (is (= "{\"type\":\"ready\"}" (:ready @calls)))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest e2b-provider-terminate-pauses-sandbox-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"}
               provider (runtime-provider/create-provider env "e2b")
               sandbox-class (runtime-provider/e2b-sandbox-class)
               original-pause (aget sandbox-class "pause")
               original-kill (aget sandbox-class "kill")
               calls (atom [])
               restore! (fn []
                          (aset sandbox-class "pause" original-pause)
                          (aset sandbox-class "kill" original-kill))]
           (aset sandbox-class "pause"
                 (fn [sandbox-id _opts]
                   (swap! calls conj {:type :pause :sandbox-id sandbox-id})
                   (js/Promise.resolve true)))
           (aset sandbox-class "kill"
                 (fn [sandbox-id _opts]
                   (swap! calls conj {:type :kill :sandbox-id sandbox-id})
                   (js/Promise.resolve true)))
           (-> (runtime-provider/<terminate-runtime! provider {:provider "e2b"
                                                               :sandbox-id "e2b-sbx-pause"})
               (.then (fn [_]
                        (restore!)
                        (is (= [{:type :pause :sandbox-id "e2b-sbx-pause"}] @calls))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected terminate error: " error))
                         (done)))))))

(deftest e2b-provider-snapshot-runtime-test
  (async done
         (let [env #js {"E2B_API_KEY" "e2b-key"}
               provider (runtime-provider/create-provider env "e2b")
               runtime {:provider "e2b"
                        :sandbox-id "e2b-sbx-1"
                        :session-id "sess-e2b-snapshot"
                        :backup-dir "/home/user/workspace/agent-test"}
               task {:project {:repo-url "https://github.com/logseq/agent-test"
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
                        (is (= "/home/user/workspace/agent-test" (:backup-dir result)))
                        (done)))
               (.catch (fn [error]
                         (restore!)
                         (is false (str "unexpected error: " error))
                         (done)))))))
