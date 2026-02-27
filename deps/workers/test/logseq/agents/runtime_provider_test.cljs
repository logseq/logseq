(ns logseq.agents.runtime-provider-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.runtime-provider :as runtime-provider]))

(defn- fetch-url [request]
  (cond
    (string? request) request
    (instance? js/URL request) (.toString request)
    (some? request) (.-url request)
    :else ""))

(defn- fetch-method [request init]
  (or (when (some? init) (aget init "method"))
      (when (and (some? request) (not (string? request))) (.-method request))
      "GET"))

(deftest provider-kind-test
  (testing "normalizes configured runtime provider"
    (is (= "sprites" (runtime-provider/provider-kind #js {})))
    (is (= "sprites" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "SPRITES"})))
    (is (= "local-dev" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-DEV"})))
    (is (= "cloudflare" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "CLOUDFLARE"})))
    (is (= "sprites" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "unknown"})))))

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
             (runtime-provider/runtime-provider-kind env {:provider "cloudflare"})))
      (is (= "cloudflare"
             (runtime-provider/runtime-provider-kind env {:provider "unknown"}))))))

(deftest provider-dispatch-test
  (testing "create-provider and resolve-provider dispatch supported providers"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "cloudflare"}]
      (is (= "sprites"
             (runtime-provider/provider-id (runtime-provider/create-provider env "sprites"))))
      (is (= "local-dev"
             (runtime-provider/provider-id (runtime-provider/create-provider env "local-dev"))))
      (is (= "cloudflare"
             (runtime-provider/provider-id (runtime-provider/create-provider env "cloudflare"))))
      (is (= "sprites"
             (runtime-provider/provider-id (runtime-provider/create-provider env "unknown"))))
      (is (= "local-dev"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "local-dev"}))))
      (is (= "cloudflare"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env nil)))))))

(deftest cloudflare-name-test
  (testing "cloudflare sandbox names are deterministic and sanitized"
    (is (= "logseq-task-sess-1"
           (runtime-provider/cloudflare-sandbox-name #js {} "sess-1")))
    (is (= "my-prefix-task-1"
           (runtime-provider/cloudflare-sandbox-name
            #js {"CLOUDFLARE_SANDBOX_NAME_PREFIX" "My Prefix_"}
            "Task 1")))))

(deftest repo-clone-command-test
  (testing "builds default repo clone command when repo url exists"
    (let [env #js {}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "mkdir -p /workspace && cd /workspace && git clone --depth 1 --single-branch --no-tags 'https://github.com/example/repo' '/workspace/sess-1' && chmod -R u+rw '/workspace/sess-1'"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "fills override repo clone command template"
    (let [env #js {"SPRITES_REPO_CLONE_COMMAND" "echo {repo_url} {session_id} {repo_dir}"}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "echo https://github.com/example/repo sess-1 /workspace/sess-1"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "returns nil when repo url missing"
    (is (nil? (runtime-provider/repo-clone-command #js {} "sess-1" {})))))

(deftest session-payload-test
  (testing "defaults codex permission mode to bypass"
    (is (= "bypass"
           (:permissionMode (runtime-provider/session-payload {:agent "codex"})))))

  (testing "keeps explicit permission mode"
    (is (= "read-only"
           (:permissionMode (runtime-provider/session-payload {:agent {:permission-mode "read-only"}}))))))

(deftest auth-json-write-command-test
  (testing "builds write command for auth.json content"
    (let [cmd (runtime-provider/auth-json-write-command "{\"token\":\"abc\"}")]
      (is (string/includes? cmd "mkdir -p ~/.codex"))
      (is (string/includes? cmd "base64 -d > ~/.codex/auth.json"))
      (is (string/includes? cmd "printf \"%s\""))))

  (testing "returns nil when auth json missing"
    (is (nil? (runtime-provider/auth-json-write-command nil)))))

(deftest local-dev-provider-provision-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"
                        "SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://127.0.0.1:2468/v1/sessions/sess-1" (fetch-url request)))
                   (is (= "POST" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200 :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-1" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "local-dev" (:provider runtime)))
                        (is (= "http://127.0.0.1:2468" (:base-url runtime)))
                        (is (= "sess-1" (:session-id runtime)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-events-stream-test
  (async done
         (let [env #js {"SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://sandbox.local"
                        :session-id "sess-2"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://sandbox.local/v1/sessions/sess-2/events/sse" (fetch-url request)))
                   (is (= "GET" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response. "data: {\"type\":\"ok\"}\n\n"
                                  #js {:status 200
                                       :headers #js {"content-type" "text/event-stream"}}))))
           (-> (runtime-provider/<open-events-stream! provider runtime)
               (.then (fn [resp]
                        (set! js/fetch original-fetch)
                        (is (= 200 (.-status resp)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-send-message-test
  (async done
         (let [env #js {"SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://sandbox.local"
                        :session-id "sess-2"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://sandbox.local/v1/sessions/sess-2/messages" (fetch-url request)))
                   (is (= "POST" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<send-message! provider runtime {:message "hello" :kind "chat"})
               (.then (fn [ok?]
                        (set! js/fetch original-fetch)
                        (is (true? ok?))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-push-branch-unsupported-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://127.0.0.1:2468"
                        :session-id "sess-push-unsupported"}]
           (-> (runtime-provider/<push-branch! provider
                                               runtime
                                               {:session-id "sess-push-unsupported"
                                                :repo-url "https://github.com/example/repo"
                                                :head-branch "feature/m14"
                                                :force false
                                                :push-token "token-1"})
               (.then (fn [_]
                        (is false "expected local-dev push to reject as unsupported")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported (:reason data)))
                           (is (= "local-dev" (:provider data))))
                         (done)))))))

(deftest sprites-provider-push-branch-command-test
  (async done
         (let [captured (atom nil)
               env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               runtime {:provider "sprites"
                        :sprite-name "sprite-1"
                        :sandbox-port 2468
                        :session-id "sess-push"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (if (and (= "POST" method)
                              (string/includes? url "/v1/sprites/sprite-1/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)]
                         (reset! captured {:url url
                                           :method method
                                           :script script})
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:ok true})
                           #js {:status 200
                                :headers #js {"content-type" "application/json"}})))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500
                              :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<push-branch! provider
                                               runtime
                                               {:session-id "sess-push"
                                                :repo-url "https://github.com/example/repo"
                                                :head-branch "feature/m14"
                                                :commit-message "feat: summarize PR updates"
                                                :force true
                                                :push-token "token-1"})
               (.then (fn [result]
                        (set! js/fetch original-fetch)
                        (is (= "feature/m14" (:head-branch result)))
                        (is (= "https://github.com/example/repo" (:repo-url result)))
                        (is (= true (:force result)))
                        (is (string/includes? (:script @captured) "git push"))
                        (is (string/includes? (:script @captured) "feature/m14"))
                        (is (string/includes? (:script @captured) "commit -m 'feat: summarize PR updates'"))
                        (is (string/includes? (:script @captured) "x-access-token:token-1"))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-send-message-test
  (async done
         (let [captured (atom nil)
               env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               runtime {:provider "sprites"
                        :sprite-name "sprite-1"
                        :sandbox-port 2468
                        :session-id "sess-4"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         parsed (js/URL. url)
                         cmds (vec (.getAll (.-searchParams parsed) "cmd"))]
                     (reset! captured {:url url
                                       :method (fetch-method request init)
                                       :script (nth cmds 2 nil)})
                     (js/Promise.resolve
                      (js/Response.
                       (js/JSON.stringify #js {:ok true})
                       #js {:status 200 :headers #js {"content-type" "application/json"}})))))
           (-> (runtime-provider/<send-message! provider runtime {:message "hello sprites"})
               (.then (fn [ok?]
                        (set! js/fetch original-fetch)
                        (is (true? ok?))
                        (is (= "POST" (:method @captured)))
                        (is (string/includes? (:url @captured) "/v1/sprites/sprite-1/exec"))
                        (is (string/includes? (:script @captured) "/v1/sessions/sess-4/messages"))
                        (is (not (string/includes? (:script @captured) "/messages/stream")))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-parses-nested-exec-output-test
  (async done
         (let [env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-ok"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-ok/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-ok"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify
                            (clj->js (cond
                                       create-session?
                                       {:result {:stdout "{\"ok\":true}\n__HTTP_STATUS__:200__HTTP_STATUS__:200"
                                                 :stderr ""}}

                                       health?
                                       {:result {:stdout "__HEALTH_OK__"
                                                 :stderr ""}}

                                       :else
                                       {:result {:stdout ""
                                                 :stderr ""}})))
                           #js {:status 200 :headers #js {"content-type" "application/json"}})))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-ok" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "sess-ok" (:session-id runtime)))
                        (is (= "sprites" (:provider runtime)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-retries-create-session-on-transient-connection-error-test
  (async done
         (let [calls (atom {:create-session 0})
               env #js {"SPRITE_TOKEN" "sprite-token"
                        "SPRITES_HEALTH_RETRIES" "2"
                        "SPRITES_HEALTH_INTERVAL_MS" "1"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-retry"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-retry/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-retry"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (cond
                           create-session?
                           (let [n (swap! calls update :create-session inc)]
                             (js/Promise.resolve
                              (js/Response.
                               (js/JSON.stringify
                                (clj->js (if (= 1 (:create-session n))
                                           {:result {:stdout "curl: (7) Failed to connect to 127.0.0.1 port 2468\n__HTTP_STATUS__:000"
                                                     :stderr ""}}
                                           {:result {:stdout "{\"ok\":true}\n__HTTP_STATUS__:200"
                                                     :stderr ""}})))
                               #js {:status 200 :headers #js {"content-type" "application/json"}})))

                           health?
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "__HEALTH_OK__" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))

                           :else
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-retry" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "sess-retry" (:session-id runtime)))
                        (is (= "sprites" (:provider runtime)))
                        (is (= 2 (:create-session @calls)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-does-not-retry-create-session-on-http-400-test
  (async done
         (let [calls (atom {:create-session 0})
               env #js {"SPRITE_TOKEN" "sprite-token"
                        "SPRITES_HEALTH_RETRIES" "2"
                        "SPRITES_HEALTH_INTERVAL_MS" "1"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-400"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-400/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-400"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (cond
                           create-session?
                           (do
                             (swap! calls update :create-session inc)
                             (js/Promise.resolve
                              (js/Response.
                               (js/JSON.stringify
                                (clj->js {:result {:stdout "{\"error\":\"bad request\"}\n__HTTP_STATUS__:400"
                                                   :stderr ""}}))
                               #js {:status 200 :headers #js {"content-type" "application/json"}})))

                           health?
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "__HEALTH_OK__" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))

                           :else
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-400" task)
               (.then (fn [_]
                        (set! js/fetch original-fetch)
                        (is false "expected provisioning to fail")
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is (= 1 (:create-session @calls)))
                         (is (= 400 (:status (ex-data error))))
                         (done)))))))

(deftest cloudflare-provider-provision-test
  (async done
         (let [calls (atom {:health 0})
               sandbox-stub
               #js {:exec
                    (fn [cmd]
                      (if (string/includes? cmd "/v1/health")
                        (let [n (swap! calls update :health inc)]
                          (js/Promise.resolve #js {:success (>= (:health n) 2)}))
                        (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                    :setEnvVars
                    (fn [vars]
                      (swap! calls assoc :env (js->clj vars))
                      (js/Promise.resolve nil))
                    :startProcess
                    (fn [cmd]
                      (swap! calls assoc :start cmd)
                      (js/Promise.resolve nil))
                    :containerFetch
                    (fn [req port]
                      (swap! calls assoc :create-url (.-url req) :create-port port :create-method (.-method req))
                      (js/Promise.resolve
                       (js/Response.
                        (js/JSON.stringify #js {:ok true})
                        #js {:status 200 :headers #js {"content-type" "application/json"}})))}
               sandbox-ns
               #js {:idFromName (fn [name]
                                  (swap! calls assoc :sandbox-name name)
                                  (str "id-" name))
                    :get (fn [id]
                           (swap! calls assoc :sandbox-id id)
                           sandbox-stub)}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"
                        "OPENAI_API_KEY" "sk-openai"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-1" task)
               (.then (fn [runtime]
                        (is (= "cloudflare" (:provider runtime)))
                        (is (= "logseq-task-sess-1" (:sandbox-id runtime)))
                        (is (= "sess-1" (:session-id runtime)))
                        (is (= "POST" (:create-method @calls)))
                        (is (string/includes? (:create-url @calls) "/v1/sessions/sess-1"))
                        (is (= "sk-openai" (get (:env @calls) "OPENAI_API_KEY")))
                        (is (string/includes? (:start @calls) "sandbox-agent server"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-events-stream-test
  (async done
         (let [calls (atom {})
               sandbox-stub
               #js {:containerFetch
                    (fn [req port]
                      (swap! calls assoc :url (.-url req) :method (.-method req) :port port)
                      (js/Promise.resolve
                       (js/Response.
                        "data: {\"type\":\"item.delta\",\"delta\":\"ok\"}\n\n"
                        #js {:status 200 :headers #js {"content-type" "text/event-stream"}})))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}]
           (-> (runtime-provider/<open-events-stream! provider runtime)
               (.then (fn [resp]
                        (is (= 200 (.-status resp)))
                        (is (= "GET" (:method @calls)))
                        (is (string/includes? (:url @calls) "/v1/sessions/sess-3/events/sse"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-send-message-test
  (async done
         (let [calls (atom {})
               sandbox-stub
               #js {:containerFetch
                    (fn [req port]
                      (swap! calls assoc :url (.-url req) :method (.-method req) :port port)
                      (js/Promise.resolve
                       (js/Response.
                        (js/JSON.stringify #js {:ok true})
                        #js {:status 200 :headers #js {"content-type" "application/json"}})))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}]
           (-> (runtime-provider/<send-message! provider runtime {:message "ping" :kind "chat"})
               (.then (fn [_]
                        (is (= "POST" (:method @calls)))
                        (is (string/includes? (:url @calls) "/v1/sessions/sess-3/messages"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-open-terminal-unsupported-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://127.0.0.1:2468"
                        :session-id "sess-terminal-unsupported"}
               request (js/Request. "http://db-sync.local/sessions/sess-terminal-unsupported/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [_]
                        (is false "expected local-dev terminal to reject as unsupported")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported-terminal (:reason data)))
                           (is (= "local-dev" (:provider data))))
                         (done)))))))

(deftest cloudflare-provider-open-terminal-test
  (async done
         (let [calls (atom {})
               session-stub
               #js {:terminal
                    (fn [request opts]
                      (swap! calls assoc
                             :terminal-url (.-url request)
                             :terminal-method (.-method request)
                             :terminal-opts (js->clj opts :keywordize-keys true))
                      (js/Promise.resolve
                       (js/Response.
                        "ok"
                        #js {:status 200})))}
               sandbox-stub
               #js {:getSession
                    (fn [session-id]
                      (swap! calls assoc :runtime-session-id session-id)
                      (js/Promise.resolve session-stub))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}
               request (js/Request. "http://db-sync.local/sessions/sess-3/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [resp]
                        (is (= 200 (.-status resp)))
                        (is (= "sess-3" (:runtime-session-id @calls)))
                        (is (= "GET" (:terminal-method @calls)))
                        (is (= 120 (get-in @calls [:terminal-opts :cols])))
                        (is (= 40 (get-in @calls [:terminal-opts :rows])))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-open-terminal-missing-method-test
  (async done
         (let [session-stub #js {}
               sandbox-stub
               #js {:getSession
                    (fn [_session-id]
                      (js/Promise.resolve session-stub))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}
               request (js/Request. "http://db-sync.local/sessions/sess-3/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [_]
                        (is false "expected cloudflare terminal to reject when session.terminal is missing")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported-terminal (:reason data)))
                           (is (= "sbx-1" (:sandbox-id data)))
                           (is (= "sess-3" (:session-id data))))
                         (done)))))))

(deftest cloudflare-provider-backup-restore-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {:clone 0
                            :restore []
                            :backups []})
               backup-counter (atom 0)
               sandboxes (atom {})
               make-sandbox
               (fn [sandbox-id]
                 #js {:exec
                      (fn [cmd]
                        (cond
                          (string/includes? cmd "/v1/health")
                          (js/Promise.resolve #js {:success true})

                          (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                          (do
                            (swap! calls update :clone inc)
                            (js/Promise.resolve #js {:success true}))

                          :else
                          (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                      :setEnvVars (fn [_] (js/Promise.resolve nil))
                      :startProcess (fn [_] (js/Promise.resolve nil))
                      :containerFetch
                      (fn [_req _port]
                        (js/Promise.resolve
                         (js/Response.
                          (js/JSON.stringify #js {:ok true})
                          #js {:status 200 :headers #js {"content-type" "application/json"}})))
                      :createBackup
                      (fn [opts]
                        (let [backup-id (str "backup-" (swap! backup-counter inc))]
                          (swap! calls update :backups conj {:sandbox-id sandbox-id
                                                             :opts (js->clj opts :keywordize-keys true)
                                                             :id backup-id})
                          (js/Promise.resolve #js {:id backup-id :dir (aget opts "dir")})))
                      :restoreBackup
                      (fn [backup]
                        (swap! calls update :restore conj {:sandbox-id sandbox-id
                                                           :backup (js->clj backup :keywordize-keys true)})
                        (js/Promise.resolve #js {:success true}))
                      :delete (fn [] (js/Promise.resolve nil))})
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [id]
                           (or (get @sandboxes id)
                               (let [sandbox (make-sandbox id)]
                                 (swap! sandboxes assoc id sandbox)
                                 sandbox)))}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"
                        "GITHUB_DEFAULT_BASE_BRANCH" "main"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-bk-1" task)
               (.then (fn [runtime-1]
                        (is (= 1 (:clone @calls)))
                        (-> (runtime-provider/<terminate-runtime! provider runtime-1)
                            (.then (fn [_]
                                     (is (= 1 (count (:backups @calls))))
                                     (is (= 604800 (get-in @calls [:backups 0 :opts :ttl])))
                                     (-> (runtime-provider/<provision-runtime! provider "sess-bk-2" task)
                                         (.then (fn [_runtime-2]
                                                  (is (= 1 (:clone @calls)))
                                                  (is (= 1 (count (:restore @calls))))
                                                  (is (= "backup-1"
                                                         (get-in @calls [:restore 0 :backup :id])))
                                                  (is (= "/workspace/sess-bk-2"
                                                         (get-in @calls [:restore 0 :backup :dir])))
                                                  (done)))
                                         (.catch (fn [error]
                                                   (is false (str "unexpected reprovision error: " error))
                                                   (done))))))
                            (.catch (fn [error]
                                      (is false (str "unexpected terminate error: " error))
                                      (done))))))
               (.catch (fn [error]
                         (is false (str "unexpected provision error: " error))
                         (done)))))))

(deftest cloudflare-provider-backup-single-pointer-per-repo-branch-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {:restore-ids []
                            :backup-ids []})
               backup-counter (atom 0)
               sandboxes (atom {})
               make-sandbox
               (fn [_sandbox-id]
                 #js {:exec
                      (fn [cmd]
                        (cond
                          (string/includes? cmd "/v1/health")
                          (js/Promise.resolve #js {:success true})
                          (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                          (js/Promise.resolve #js {:success true})
                          :else
                          (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                      :setEnvVars (fn [_] (js/Promise.resolve nil))
                      :startProcess (fn [_] (js/Promise.resolve nil))
                      :containerFetch
                      (fn [_req _port]
                        (js/Promise.resolve
                         (js/Response.
                          (js/JSON.stringify #js {:ok true})
                          #js {:status 200 :headers #js {"content-type" "application/json"}})))
                      :createBackup
                      (fn [_opts]
                        (let [backup-id (str "backup-" (swap! backup-counter inc))]
                          (swap! calls update :backup-ids conj backup-id)
                          (js/Promise.resolve #js {:id backup-id :dir "/workspace"})))
                      :restoreBackup
                      (fn [backup]
                        (swap! calls update :restore-ids conj (aget backup "id"))
                        (js/Promise.resolve #js {:success true}))
                      :delete (fn [] (js/Promise.resolve nil))})
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [id]
                           (or (get @sandboxes id)
                               (let [sandbox (make-sandbox id)]
                                 (swap! sandboxes assoc id sandbox)
                                 sandbox)))}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"
                        "GITHUB_DEFAULT_BASE_BRANCH" "main"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-bk-a" task)
               (.then (fn [runtime-a]
                        (-> (runtime-provider/<terminate-runtime! provider runtime-a)
                            (.then (fn [_]
                                     (-> (runtime-provider/<provision-runtime! provider "sess-bk-b" task)
                                         (.then (fn [runtime-b]
                                                  (-> (runtime-provider/<terminate-runtime! provider runtime-b)
                                                      (.then (fn [_]
                                                               (-> (runtime-provider/<provision-runtime! provider "sess-bk-c" task)
                                                                   (.then (fn [_runtime-c]
                                                                            (is (= ["backup-1" "backup-2"]
                                                                                   (:restore-ids @calls)))
                                                                            (is (= ["backup-1" "backup-2"]
                                                                                   (:backup-ids @calls)))
                                                                            (done)))
                                                                   (.catch (fn [error]
                                                                             (is false (str "unexpected third provision error: " error))
                                                                             (done))))))
                                                      (.catch (fn [error]
                                                                (is false (str "unexpected second terminate error: " error))
                                                                (done))))))
                                         (.catch (fn [error]
                                                   (is false (str "unexpected second provision error: " error))
                                                   (done))))))
                            (.catch (fn [error]
                                      (is false (str "unexpected first terminate error: " error))
                                      (done))))))
               (.catch (fn [error]
                         (is false (str "unexpected first provision error: " error))
                         (done)))))))
