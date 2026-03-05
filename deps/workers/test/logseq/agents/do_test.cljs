(ns logseq.agents.do-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.checkpoint-store :as checkpoint-store]
            [logseq.agents.do :as agent-do]
            [logseq.agents.runtime-provider :as runtime-provider]
            [logseq.agents.source-control :as source-control]
            [logseq.agents.workspace-bundle-r2 :as workspace-bundle-r2]
            [logseq.agents.workspace-bundle-store :as workspace-bundle-store]
            [logseq.sync.common :as common]))

(defn- make-agent-storage []
  (let [data (js/Map.)]
    #js {:get (fn [k]
                (js/Promise.resolve (.get data k)))
         :put (fn [k v]
                (.set data k v)
                (js/Promise.resolve nil))}))

(defn- make-limited-agent-storage [max-bytes]
  (let [data (js/Map.)]
    {:data data
     :storage #js {:get (fn [k]
                          (js/Promise.resolve (.get data k)))
                   :put (fn [k v]
                          (if (> (.-length (js/JSON.stringify v)) max-bytes)
                            (js/Promise.reject (js/Error. "string or blob too big: SQLITE_TOOBIG Error"))
                            (do
                              (.set data k v)
                              (js/Promise.resolve nil))))}}))

(defn- make-self [env]
  #js {:env env
       :storage (make-agent-storage)
       :streams (js/Map.)})

(defn- make-limited-self [env max-bytes]
  (let [{:keys [data storage]} (make-limited-agent-storage max-bytes)]
    {:self #js {:env env
                :storage storage
                :streams (js/Map.)}
     :data data}))

(defn- json-request
  [url method body headers]
  (let [^js req-headers (js/Headers.)]
    (doseq [[k v] headers]
      (.set req-headers k v))
    (js/Request.
     url
     (clj->js (cond-> {:method method
                       :headers req-headers}
                (some? body) (assoc :body (js/JSON.stringify (clj->js body))))))))

(defn- <json [^js resp]
  (.then (.json resp) #(js->clj % :keywordize-keys true)))

(deftest init-session-respects-task-runtime-provider-test
  (testing "session init uses task runtime-provider over env default provider"
    (async done
           (let [calls (atom {:create 0
                              :events 0})
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "cloudflare"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-provider-override"
                            :project {:id "project-1"}
                            :agent "codex"
                            :runtime-provider "local-dev"}]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-provider-override")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         (and (= "GET" method)
                              (string/includes? url "/v1/sessions/sess-provider-override/events/sse"))
                         (do
                           (swap! calls update :events inc)
                           (js/Promise.resolve
                            (js/Response.
                             "data: {\"type\":\"session.running\"}\n\n"
                             #js {:status 200
                                  :headers #js {"content-type" "text/event-stream"}})))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unexpected request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (-> (agent-do/handle-fetch self
                                        (json-request "http://db-sync.local/__session__/init"
                                                      "POST"
                                                      init-body
                                                      headers))
                 (.then (fn [resp]
                          (.then (<json resp)
                                 (fn [body]
                                   (set! js/fetch original-fetch)
                                   (is (= 200 (.-status resp)))
                                   (is (= "local-dev" (:runtime-provider body)))
                                   (is (= 1 (:create @calls)))
                                   (is (>= (:events @calls) 1))
                                   (done)))))
                 (.catch (fn [error]
                           (set! js/fetch original-fetch)
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest messages-use-single-events-stream-and-dont-duplicate-user-message-test
  (testing "session messages post to /messages while keeping one /events/sse stream and no audit message payload"
    (async done
           (let [calls (atom {:create 0
                              :messages 0
                              :message-stream 0
                              :events-sse 0})
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-1"
                            :project {:id "project-1"}
                            :agent "codex"}]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-1")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         (and (= "GET" method)
                              (string/includes? url "/v1/sessions/sess-1/events/sse"))
                         (do
                           (swap! calls update :events-sse inc)
                           (let [stream (js/TransformStream.)
                                 writer (.getWriter (.-writable stream))
                                 payload (.encode (js/TextEncoder.)
                                                  "data: {\"type\":\"item.delta\",\"delta\":\"ok\"}\n\n")]
                             ;; Keep the stream open to verify we don't reopen per user message.
                             (.write writer payload)
                             (js/Promise.resolve
                              (js/Response.
                               (.-readable stream)
                               #js {:status 200
                                    :headers #js {"content-type" "text/event-stream"}}))))

                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-1/messages/stream"))
                         (do
                           (swap! calls update :message-stream inc)
                           (js/Promise.resolve
                            (js/Response.
                             "data: {\"type\":\"item.delta\",\"delta\":\"ok\"}\n\n"
                             #js {:status 200
                                  :headers #js {"content-type" "text/event-stream"}})))

                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-1/messages")
                              (not (string/includes? url "/messages/stream")))
                         (do
                           (swap! calls update :messages inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unhandled request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (let [promise (-> (agent-do/handle-fetch self
                                                      (json-request "http://db-sync.local/__session__/init"
                                                                    "POST"
                                                                    init-body
                                                                    headers))
                               (.then (fn [_]
                                        (agent-do/handle-fetch self
                                                               (json-request "http://db-sync.local/__session__/messages"
                                                                             "POST"
                                                                             {:message "hello"}
                                                                             headers))))
                               (.then (fn [_]
                                        (agent-do/handle-fetch self
                                                               (json-request "http://db-sync.local/__session__/messages"
                                                                             "POST"
                                                                             {:message "follow up"}
                                                                             headers))))
                               (.then (fn [_]
                                        (agent-do/handle-fetch self
                                                               (json-request "http://db-sync.local/__session__/events"
                                                                             "GET"
                                                                             nil
                                                                             {"x-user-id" "user-1"}))))
                               (.then (fn [events-resp]
                                        (.then (<json events-resp)
                                               (fn [body]
                                                 (set! js/fetch original-fetch)
                                                 (is (= 1 (:create @calls)))
                                                 (is (= 2 (:messages @calls)))
                                                 (is (= 1 (:events-sse @calls)))
                                                 (is (= 0 (:message-stream @calls)))
                                                 (let [events (:events body)
                                                       duplicated (filter (fn [event]
                                                                            (and (= "audit.log" (:type event))
                                                                                 (string? (get-in event [:data :message]))))
                                                                          events)]
                                                   (is (zero? (count duplicated))))
                                                 (done))))))]
               (.catch promise
                       (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done))))))))

(deftest messages-reprovision-runtime-after-send-failure-test
  (testing "session messages reprovision runtime and retry send when current runtime is stale"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 send-runtime-ids (atom [])
                 provision-calls (atom 0)]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-reprovision"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "runtime-old"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<send-message!
                                        (fn [_provider runtime _message]
                                          (swap! send-runtime-ids conj (:session-id runtime))
                                          (if (= "runtime-old" (:session-id runtime))
                                            (js/Promise.reject (ex-info "stale runtime" {}))
                                            (js/Promise.resolve true)))
                                        agent-do/<provision-runtime!
                                        (fn [self _task _session-id]
                                          (swap! provision-calls inc)
                                          (-> (.get (.-storage self) "session")
                                              (.then (fn [session-js]
                                                       (let [session (js->clj session-js :keywordize-keys true)
                                                             next-session (assoc session
                                                                                 :runtime {:provider "local-dev"
                                                                                           :session-id "runtime-new"})]
                                                         (.put (.-storage self) "session" (clj->js next-session)))))
                                              (.then (fn [_]
                                                       {:provider "local-dev"
                                                        :session-id "runtime-new"}))))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/messages"
                                                                 "POST"
                                                                 {:message "retry me"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (js/setTimeout
                           (fn []
                             (is (= 1 @provision-calls))
                             (is (= ["runtime-old" "runtime-new"] @send-runtime-ids))
                             (done))
                           30)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest messages-resume-completed-session-and-provision-runtime-test
  (testing "session messages should auto-resume completed session and provision runtime"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 provision-calls (atom 0)
                 sent-runtime-ids (atom [])]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-completed-resume"
                                 :status "completed"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime nil
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [agent-do/<provision-runtime!
                                        (fn [self _task _session-id]
                                          (swap! provision-calls inc)
                                          (-> (.get (.-storage self) "session")
                                              (.then (fn [session-js]
                                                       (let [session (js->clj session-js :keywordize-keys true)
                                                             next-session (assoc session
                                                                                 :runtime {:provider "local-dev"
                                                                                           :session-id "runtime-resumed"})]
                                                         (.put (.-storage self) "session" (clj->js next-session)))))
                                              (.then (fn [_]
                                                       {:provider "local-dev"
                                                        :session-id "runtime-resumed"}))))
                                        runtime-provider/<send-message!
                                        (fn [_provider runtime _message]
                                          (swap! sent-runtime-ids conj (:session-id runtime))
                                          (js/Promise.resolve true))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/messages"
                                                                 "POST"
                                                                 {:message "continue"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (js/setTimeout
                           (fn []
                             (-> (.get (.-storage self) "session")
                                 (.then (fn [session-js]
                                          (let [session (js->clj session-js :keywordize-keys true)]
                                            (is (= "running" (:status session)))
                                            (is (= 1 @provision-calls))
                                            (is (= ["runtime-resumed"] @sent-runtime-ids))
                                            (done)))))
                             (.catch (fn [error]
                                       (is false (str "unexpected readback error: " error))
                                       (done)))))
                          30)))
             (.catch (fn [error]
                       (is false (str "unexpected completed-resume error: " error))
                       (done)))))))

(deftest messages-canceled-session-resumes-and-provisions-runtime-test
  (testing "session messages should resume canceled session and provision runtime"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 provision-calls (atom 0)
                 sent-runtime-ids (atom [])]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-canceled-no-resume"
                                 :status "canceled"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime nil
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [agent-do/<provision-runtime!
                                        (fn [_self _task _session-id]
                                          (swap! provision-calls inc)
                                          (-> (.get (.-storage self) "session")
                                              (.then (fn [session-js]
                                                       (let [session (js->clj session-js :keywordize-keys true)
                                                             next-session (assoc session
                                                                                 :runtime {:provider "local-dev"
                                                                                           :session-id "runtime-resumed-canceled"})]
                                                         (.put (.-storage self) "session" (clj->js next-session)))))
                                              (.then (fn [_]
                                                       {:provider "local-dev"
                                                        :session-id "runtime-resumed-canceled"}))))
                                        runtime-provider/<send-message!
                                        (fn [_provider runtime _message]
                                          (swap! sent-runtime-ids conj (:session-id runtime))
                                          (js/Promise.resolve true))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/messages"
                                                                 "POST"
                                                                 {:message "resume after cancel"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.get (.-storage self) "session")))
                 (.then (fn [session-js]
                          (let [session (js->clj session-js :keywordize-keys true)]
                            (is (= "running" (:status session)))
                            (is (= 1 @provision-calls))
                            (is (= ["runtime-resumed-canceled"] @sent-runtime-ids))
                            (done))))
                 (.catch (fn [error]
                           (is false (str "unexpected canceled-resume error: " error))
                           (done))))))))

(deftest provision-runtime-persists-runtime-checkpoint-test
  (testing "provisioned runtime snapshot metadata is persisted to task sandbox checkpoint"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"}
                 self (make-self env)
                 task {:agent "codex"
                       :project {:repo-url "https://github.com/example/repo"}}
                 runtime {:provider "vercel"
                          :session-id "sess-runtime"
                          :sandbox-id "sbx-runtime"
                          :backup-key "github/logseq/agent-test#main"
                          :backup-dir "/vercel/sandbox/agent-test"
                          :snapshot-id "vercel-snapshot-42"}
                 provider (reify runtime-provider/RuntimeProvider
                            (<provision-runtime! [_ _session-id _task]
                              (js/Promise.resolve runtime))
                            (<open-events-stream! [_ _runtime]
                              (js/Promise.resolve nil))
                            (<send-message! [_ _runtime _message]
                              (js/Promise.resolve true))
                            (<open-terminal! [_ _runtime _request _opts]
                              (js/Promise.resolve nil))
                            (<snapshot-runtime! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<export-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<apply-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve true))
                            (<push-branch! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<terminate-runtime! [_ _runtime]
                              (js/Promise.resolve nil)))]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-runtime"
                                 :status "running"
                                 :task task
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/resolve-provider (fn [_env _runtime] provider)
                                        runtime-provider/provider-id (fn [_provider] "vercel")
                                        agent-do/start-runtime-events-stream-background! (fn [& _] nil)]
                            (#'agent-do/<provision-runtime! self task "sess-runtime"))))
                 (.then (fn [_]
                          (.then (.get (.-storage self) "session")
                                 (fn [session-js]
                                   (let [session (js->clj session-js :keywordize-keys true)
                                         checkpoint (get-in session [:task :sandbox-checkpoint])]
                                     (is (= "vercel-snapshot-42" (:snapshot-id checkpoint)))
                                     (is (= "vercel" (:provider checkpoint)))
                                     (is (= "github/logseq/agent-test#main" (:backup-key checkpoint)))
                                     (is (= "/vercel/sandbox/agent-test" (:backup-dir checkpoint)))
                                     (is (= "provisioned" (:reason checkpoint)))
                                     (is (number? (:checkpoint-at checkpoint)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected provision checkpoint error: " error))
                           (done))))))))

(deftest provision-runtime-loads-checkpoint-from-d1-test
  (testing "provision runtime should load sandbox checkpoint from D1 metadata by repo+branch"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"
                          "AGENTS_DB" #js {}}
                 self (make-self env)
                 task {:id "sess-d1-checkpoint"
                       :agent "codex"
                       :project {:repo-url "https://github.com/logseq/logseq"
                                 :base-branch "main"}}
                 passed-task (atom nil)
                 runtime {:provider "vercel"
                          :session-id "runtime-d1"
                          :sandbox-id "sbx-d1"}
                 provider (reify runtime-provider/RuntimeProvider
                            (<provision-runtime! [_ _session-id task]
                              (reset! passed-task task)
                              (js/Promise.resolve runtime))
                            (<open-events-stream! [_ _runtime]
                              (js/Promise.resolve nil))
                            (<send-message! [_ _runtime _message]
                              (js/Promise.resolve true))
                            (<open-terminal! [_ _runtime _request _opts]
                              (js/Promise.resolve nil))
                            (<snapshot-runtime! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<export-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<apply-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve true))
                            (<push-branch! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<terminate-runtime! [_ _runtime]
                              (js/Promise.resolve nil)))
                 row #js {"provider" "vercel"
                          "snapshot_id" "snapshot-from-d1"
                          "backup_key" "github/logseq/logseq#main"
                          "backup_dir" "/vercel/sandbox/logseq"
                          "checkpoint_at" 1000}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-d1-checkpoint"
                                 :status "running"
                                 :task task
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/resolve-provider (fn [_env _runtime] provider)
                                        runtime-provider/provider-id (fn [_provider] "vercel")
                                        agent-do/start-runtime-events-stream-background! (fn [& _] nil)
                                        common/<d1-all (fn [_db _sql & _args]
                                                         (js/Promise.resolve #js {:results #js [row]}))
                                        common/get-sql-rows (fn [result]
                                                              (aget result "results"))]
                            (#'agent-do/<provision-runtime! self task "sess-d1-checkpoint"))))
                 (.then (fn [_]
                          (is (= "snapshot-from-d1"
                                 (get-in @passed-task [:sandbox-checkpoint :snapshot-id])))
                          (is (= "vercel"
                                 (get-in @passed-task [:sandbox-checkpoint :provider])))
                          (is (= "github/logseq/logseq#main"
                                 (get-in @passed-task [:sandbox-checkpoint :backup-key])))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected d1 checkpoint provision error: " error))
                           (done))))))))

(deftest provision-runtime-does-not-use-storage-checkpoint-fallback-test
  (testing "provision runtime should not use Durable Object storage checkpoint fallback"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"
                          "AGENTS_DB" #js {}}
                 self (make-self env)
                 task {:id "sess-no-storage-fallback"
                       :agent "codex"
                       :project {:repo-url "https://github.com/logseq/logseq"
                                 :base-branch "main"}}
                 passed-task (atom nil)
                 runtime {:provider "vercel"
                          :session-id "runtime-no-storage-fallback"
                          :sandbox-id "sbx-no-storage-fallback"}
                 provider (reify runtime-provider/RuntimeProvider
                            (<provision-runtime! [_ _session-id task]
                              (reset! passed-task task)
                              (js/Promise.resolve runtime))
                            (<open-events-stream! [_ _runtime]
                              (js/Promise.resolve nil))
                            (<send-message! [_ _runtime _message]
                              (js/Promise.resolve true))
                            (<open-terminal! [_ _runtime _request _opts]
                              (js/Promise.resolve nil))
                            (<snapshot-runtime! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<export-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<apply-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve true))
                            (<push-branch! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<terminate-runtime! [_ _runtime]
                              (js/Promise.resolve nil)))]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-no-storage-fallback"
                                 :status "running"
                                 :task task
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (.put (.-storage self)
                                "sandbox.checkpoint"
                                (clj->js {:provider "vercel"
                                          :snapshot-id "from-storage-should-not-be-used"}))))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/resolve-provider (fn [_env _runtime] provider)
                                        runtime-provider/provider-id (fn [_provider] "vercel")
                                        agent-do/start-runtime-events-stream-background! (fn [& _] nil)
                                        common/<d1-all (fn [_db _sql & _args]
                                                         (js/Promise.resolve #js {:results #js []}))
                                        common/get-sql-rows (fn [result]
                                                              (aget result "results"))]
                            (#'agent-do/<provision-runtime! self task "sess-no-storage-fallback"))))
                 (.then (fn [_]
                          (is (nil? (get-in @passed-task [:sandbox-checkpoint :snapshot-id])))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected no-storage-fallback error: " error))
                           (done))))))))

(deftest checkpoint-existing-snapshot-falls-back-to-runtime-snapshot-test
  (testing "checkpoint refresh reuses runtime snapshot metadata when task checkpoint is missing"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 session {:id "sess-runtime-checkpoint"
                          :status "running"
                          :task {:project {:repo-url "https://github.com/example/repo"}}
                          :runtime {:provider "vercel"
                                    :session-id "sess-runtime-checkpoint"
                                    :sandbox-id "sbx-runtime-checkpoint"
                                    :snapshot-id "runtime-snapshot-7"
                                    :backup-key "github/logseq/agent-test#main"
                                    :backup-dir "/vercel/sandbox/agent-test"}
                          :audit {}
                          :created-at 0
                          :updated-at 0}]
             (-> (.put (.-storage self) "session" (clj->js session))
                 (.then (fn [_]
                          (#'agent-do/<checkpoint-existing-snapshot! self
                                                                     session
                                                                     {:by "system"
                                                                      :reason "pr-ready"})))
                 (.then (fn [ok?]
                          (is (true? ok?))
                          (.then (.get (.-storage self) "session")
                                 (fn [session-js]
                                   (let [session (js->clj session-js :keywordize-keys true)
                                         checkpoint (get-in session [:task :sandbox-checkpoint])]
                                     (is (= "runtime-snapshot-7" (:snapshot-id checkpoint)))
                                     (is (= "vercel" (:provider checkpoint)))
                                     (is (= "github/logseq/agent-test#main" (:backup-key checkpoint)))
                                     (is (= "/vercel/sandbox/agent-test" (:backup-dir checkpoint)))
                                     (is (= "pr-ready" (:reason checkpoint)))
                                     (is (number? (:checkpoint-at checkpoint)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected runtime-checkpoint fallback error: " error))
                           (done))))))))

(deftest checkpoint-existing-snapshot-upserts-d1-metadata-test
  (testing "checkpoint refresh should upsert checkpoint metadata into D1"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"
                          "AGENTS_DB" #js {}}
                 self (make-self env)
                 session {:id "sess-checkpoint-d1-upsert"
                          :status "running"
                          :task {:project {:repo-url "https://github.com/logseq/logseq"
                                           :base-branch "main"}}
                          :runtime {:provider "vercel"
                                    :session-id "sess-checkpoint-d1-upsert"
                                    :sandbox-id "sbx-checkpoint-d1-upsert"
                                    :snapshot-id "runtime-snapshot-d1-upsert"
                                    :backup-key "github/logseq/logseq#main"
                                    :backup-dir "/vercel/sandbox/logseq"}
                          :audit {}
                          :created-at 0
                          :updated-at 0}
                 d1-runs (atom 0)]
             (-> (.put (.-storage self) "session" (clj->js session))
                 (.then (fn [_]
                          (with-redefs [common/<d1-run (fn [_db _sql & _args]
                                                         (swap! d1-runs inc)
                                                         (js/Promise.resolve {:ok true}))]
                            (#'agent-do/<checkpoint-existing-snapshot! self
                                                                       session
                                                                       {:by "system"
                                                                        :reason "session-completed"}))))
                 (.then (fn [ok?]
                          (is (true? ok?))
                          (is (= 1 @d1-runs))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected checkpoint d1 upsert error: " error))
                           (done))))))))

(deftest checkpoint-existing-snapshot-persists-workspace-bundle-test
  (testing "checkpoint refresh exports workspace bundle and persists bundle pointer metadata"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"}
                 self (make-self env)
                 session {:id "sess-checkpoint-bundle"
                          :status "running"
                          :task {:id "sess-checkpoint-bundle"
                                 :project {:repo-url "https://github.com/logseq/logseq"
                                           :base-branch "main"}}
                          :runtime {:provider "vercel"
                                    :session-id "sess-checkpoint-bundle"
                                    :sandbox-id "sbx-checkpoint-bundle"
                                    :snapshot-id "runtime-snapshot-bundle"
                                    :backup-key "github/logseq/logseq#main"
                                    :backup-dir "/vercel/sandbox/logseq"}
                          :audit {}
                          :created-at 0
                          :updated-at 0}]
             (-> (.put (.-storage self) "session" (clj->js session))
                 (.then (fn [_]
                          (with-redefs [checkpoint-store/<upsert-checkpoint-for-task! (fn [_env _task checkpoint]
                                                                                        (js/Promise.resolve checkpoint))
                                        runtime-provider/<export-workspace-bundle! (fn [_provider _runtime _opts]
                                                                                     (js/Promise.resolve {:head-sha "abc123"
                                                                                                          :base-sha "base123"
                                                                                                          :byte-size 16
                                                                                                          :checksum "sha256-123"
                                                                                                          :head-branch "feat/m22"
                                                                                                          :bundle-base64 "ZmFrZS1idW5kbGUtZGF0YQ=="}))
                                        workspace-bundle-r2/<put-bundle-base64! (fn [_env object-key bundle-base64 _metadata]
                                                                                  (js/Promise.resolve {:object-key object-key
                                                                                                       :bundle-base64 bundle-base64}))
                                        workspace-bundle-store/<upsert-bundle-for-task! (fn [_env _task bundle]
                                                                                          (js/Promise.resolve (assoc bundle
                                                                                                                     :bundle-id "bundle-1"
                                                                                                                     :bundle-seq 1
                                                                                                                     :object-key "workspace-bundles/github/logseq/logseq/main/bundle-1.bundle.b64")))]
                            (#'agent-do/<checkpoint-existing-snapshot! self
                                                                       session
                                                                       {:by "system"
                                                                        :reason "pr-ready"}))))
                 (.then (fn [ok?]
                          (is (true? ok?))
                          (.then (.get (.-storage self) "session")
                                 (fn [session-js]
                                   (let [stored (js->clj session-js :keywordize-keys true)
                                         checkpoint (get-in stored [:task :sandbox-checkpoint])]
                                     (is (= "bundle-1" (:bundle-id checkpoint)))
                                     (is (= 1 (:bundle-seq checkpoint)))
                                     (is (= "abc123" (:bundle-head-sha checkpoint)))
                                     (is (= "workspace-bundles/github/logseq/logseq/main/bundle-1.bundle.b64"
                                            (:bundle-object-key checkpoint)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected checkpoint bundle error: " error))
                           (done))))))))

(deftest provision-runtime-restores-workspace-bundle-test
  (testing "provision runtime applies latest workspace bundle and stores bundle metadata in checkpoint"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"}
                 self (make-self env)
                 task {:id "sess-restore-bundle"
                       :agent "codex"
                       :project {:repo-url "https://github.com/logseq/logseq"
                                 :base-branch "main"}}
                 runtime {:provider "vercel"
                          :session-id "runtime-restore-bundle"
                          :sandbox-id "sbx-restore-bundle"}
                 applied (atom nil)
                 provider (reify runtime-provider/RuntimeProvider
                            (<provision-runtime! [_ _session-id _task]
                              (js/Promise.resolve runtime))
                            (<open-events-stream! [_ _runtime]
                              (js/Promise.resolve nil))
                            (<send-message! [_ _runtime _message]
                              (js/Promise.resolve true))
                            (<open-terminal! [_ _runtime _request _opts]
                              (js/Promise.resolve nil))
                            (<snapshot-runtime! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<export-workspace-bundle! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<apply-workspace-bundle! [_ runtime opts]
                              (reset! applied {:runtime runtime :opts opts})
                              (js/Promise.resolve true))
                            (<push-branch! [_ _runtime _opts]
                              (js/Promise.resolve nil))
                            (<terminate-runtime! [_ _runtime]
                              (js/Promise.resolve nil)))]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-restore-bundle"
                                 :status "running"
                                 :task task
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/resolve-provider (fn [_env _runtime] provider)
                                        runtime-provider/provider-id (fn [_provider] "vercel")
                                        agent-do/start-runtime-events-stream-background! (fn [& _] nil)
                                        checkpoint-store/<load-checkpoint-for-task! (fn [_env _task] (js/Promise.resolve nil))
                                        workspace-bundle-store/<load-latest-bundle-for-task! (fn [_env _task session-id]
                                                                                               (is (= "sess-restore-bundle" session-id))
                                                                                               (js/Promise.resolve {:bundle-id "bundle-restore-1"
                                                                                                                    :session-id session-id
                                                                                                                    :bundle-seq 3
                                                                                                                    :object-key "workspace-bundles/github/logseq/logseq/main/bundle-restore-1.bundle.b64"
                                                                                                                    :head-sha "abc123"
                                                                                                                    :head-branch "feat/m22"}))
                                        workspace-bundle-r2/<get-bundle-base64! (fn [_env object-key]
                                                                                  (js/Promise.resolve {:object-key object-key
                                                                                                       :bundle-base64 "ZmFrZS1idW5kbGUtZGF0YQ=="}))]
                            (#'agent-do/<provision-runtime! self task "sess-restore-bundle"))))
                 (.then (fn [_]
                          (is (= "runtime-restore-bundle" (get-in @applied [:runtime :session-id])))
                          (is (= "abc123" (get-in @applied [:opts :head-sha])))
                          (.then (.get (.-storage self) "session")
                                 (fn [session-js]
                                   (let [stored (js->clj session-js :keywordize-keys true)
                                         checkpoint (get-in stored [:task :sandbox-checkpoint])]
                                     (is (= "bundle-restore-1" (:bundle-id checkpoint)))
                                     (is (= 3 (:bundle-seq checkpoint)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected restore bundle error: " error))
                           (done))))))))

(deftest restore-workspace-bundle-skips-when-session-changed-test
  (testing "bundle apply should be skipped when expected session is no longer current"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "vercel"}
                 self (make-self env)
                 apply-calls (atom 0)
                 task {:id "sess-old"
                       :agent "codex"
                       :project {:repo-url "https://github.com/logseq/logseq"
                                 :base-branch "main"}}
                 runtime {:provider "vercel"
                          :session-id "runtime-old"
                          :sandbox-id "sbx-old"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-new"
                                 :status "running"
                                 :task task
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [workspace-bundle-store/<load-latest-bundle-for-task! (fn [_env _task _session-id]
                                                                                               (js/Promise.resolve {:bundle-id "bundle-stale-1"
                                                                                                                    :session-id "sess-old"
                                                                                                                    :bundle-seq 1
                                                                                                                    :object-key "workspace-bundles/github/logseq/logseq/main/bundle-stale-1.bundle.b64"
                                                                                                                    :head-sha "abc123"
                                                                                                                    :head-branch "feat/m22"}))
                                        workspace-bundle-r2/<get-bundle-base64! (fn [_env _object-key]
                                                                                  (js/Promise.resolve {:bundle-base64 "ZmFrZS1idW5kbGUtZGF0YQ=="}))
                                        runtime-provider/<apply-workspace-bundle! (fn [_provider _runtime _opts]
                                                                                    (swap! apply-calls inc)
                                                                                    (js/Promise.resolve true))]
                            (#'agent-do/<restore-workspace-bundle! self "sess-old" task runtime))))
                 (.then (fn [result]
                          (is (nil? result))
                          (is (zero? @apply-calls))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected stale-session restore error: " error))
                           (done))))))))

(deftest runtime-session-completed-checkpoints-existing-and-terminates-test
  (testing "session.completed runtime event checkpoints existing pointer and terminates runtime without snapshot creation"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 terminate-calls (atom [])
                 snapshot-calls (atom [])]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-completed"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}
                                        :sandbox-checkpoint {:provider "cloudflare"
                                                             :snapshot-id "checkpoint-existing-completed"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-completed"
                                           :session-id "sess-completed"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<snapshot-runtime!
                                        (fn [_provider runtime _opts]
                                          (swap! snapshot-calls conj runtime)
                                          (js/Promise.resolve {:snapshot-id "new-snapshot-should-not-happen"}))
                                        agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (#'agent-do/<append-runtime-event! self
                                                               "sess-completed"
                                                               {:type "session.completed"}))))
                 (.then (fn [_]
                          (.then (.get (.-storage self) "session")
                                 (fn [session]
                                   (let [session (js->clj session :keywordize-keys true)]
                                     (is (empty? @snapshot-calls))
                                     (is (= 1 (count @terminate-calls)))
                                     (is (nil? (:runtime session)))
                                     (is (= "checkpoint-existing-completed"
                                            (get-in session [:task :sandbox-checkpoint :snapshot-id])))
                                     (is (number? (get-in session [:task :sandbox-checkpoint :checkpoint-at])))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest runtime-session-canceled-terminates-runtime-test
  (testing "session.canceled runtime event terminates runtime and clears sandbox runtime"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 terminate-calls (atom [])]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-canceled"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-canceled"
                                           :session-id "sess-canceled"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (#'agent-do/<append-runtime-event! self
                                                               "sess-canceled"
                                                               {:type "session.canceled"}))))
                 (.then (fn [_]
                          (.then (.get (.-storage self) "session")
                                 (fn [session]
                                   (let [session (js->clj session :keywordize-keys true)]
                                     (is (= 1 (count @terminate-calls)))
                                     (is (= "canceled" (:status session)))
                                     (is (nil? (:runtime session)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest init-does-not-wait-for-open-events-stream-test
  (testing "session init returns immediately even when runtime events stream stays open"
    (async done
           (let [calls (atom {:create 0
                              :events-sse 0})
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-init-fast"
                            :project {:id "project-1"}
                            :agent "codex"}
                 timeout-id (js/setTimeout (fn []
                                             (set! js/fetch original-fetch)
                                             (is false "init blocked waiting on events stream")
                                             (done))
                                           250)]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-init-fast")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         (and (= "GET" method)
                              (string/includes? url "/v1/sessions/sess-init-fast/events/sse"))
                         (do
                           (swap! calls update :events-sse inc)
                           (let [stream (js/TransformStream.)]
                             ;; Never close/read completion from this stream.
                             (js/Promise.resolve
                              (js/Response.
                               (.-readable stream)
                               #js {:status 200
                                    :headers #js {"content-type" "text/event-stream"}}))))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unhandled request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (-> (agent-do/handle-fetch self
                                        (json-request "http://db-sync.local/__session__/init"
                                                      "POST"
                                                      init-body
                                                      headers))
                 (.then (fn [resp]
                          (js/clearTimeout timeout-id)
                          (set! js/fetch original-fetch)
                          (is (= 200 (.-status resp)))
                          (is (= 1 (:create @calls)))
                          (is (= 1 (:events-sse @calls)))
                          (done)))
                 (.catch (fn [error]
                           (js/clearTimeout timeout-id)
                           (set! js/fetch original-fetch)
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest init-does-not-await-start-runtime-events-stream-return-test
  (testing "session init should not await start-runtime-events-stream! promise"
    (async done
           (let [calls (atom {:create 0})
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-init-no-await"
                            :project {:id "project-1"}
                            :agent "codex"}
                 timeout-id (js/setTimeout (fn []
                                             (set! js/fetch original-fetch)
                                             (is false "init awaited start-runtime-events-stream! promise")
                                             (done))
                                           250)]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-init-no-await")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unhandled request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (with-redefs [agent-do/start-runtime-events-stream!
                           (fn [& _]
                             (js/Promise. (fn [_resolve _reject])))]
               (-> (agent-do/handle-fetch self
                                          (json-request "http://db-sync.local/__session__/init"
                                                        "POST"
                                                        init-body
                                                        headers))
                   (.then (fn [resp]
                            (js/clearTimeout timeout-id)
                            (set! js/fetch original-fetch)
                            (is (= 200 (.-status resp)))
                            (is (= 1 (:create @calls)))
                            (done)))
                   (.catch (fn [error]
                             (js/clearTimeout timeout-id)
                             (set! js/fetch original-fetch)
                             (is false (str "unexpected error: " error))
                             (done)))))))))

(deftest stream-emits-byte-chunks-for-broadcast-events-test
  (testing "session stream emits Uint8Array chunks for live broadcast events"
    (async done
           (let [self (make-self #js {})
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 timeout-id (js/setTimeout (fn []
                                             (is false "timed out waiting for stream chunk")
                                             (done))
                                           500)]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-bytes"
                                 :status "running"
                                 :task {}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/stream"
                                                               "GET"
                                                               nil
                                                               {"x-user-id" "user-1"}))))
                 (.then (fn [stream-resp]
                          (let [reader (.getReader (.-body stream-resp))]
                            (-> (agent-do/handle-fetch self
                                                       (json-request "http://db-sync.local/__session__/messages"
                                                                     "POST"
                                                                     {:message "hello"}
                                                                     headers))
                                (.then (fn [_]
                                         (.read reader)))
                                (.then (fn [chunk]
                                         (js/clearTimeout timeout-id)
                                         (is (not (.-done chunk)))
                                         (is (instance? js/Uint8Array (.-value chunk)))
                                         (done)))
                                (.catch (fn [error]
                                          (js/clearTimeout timeout-id)
                                          (is false (str "unexpected error: " error))
                                          (done)))))))
                 (.catch (fn [error]
                           (js/clearTimeout timeout-id)
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest messages-response-does-not-wait-for-runtime-send-test
  (testing "session messages endpoint responds immediately even if runtime send hangs"
    (async done
           (let [calls (atom {:create 0 :send 0 :events-sse 0})
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-fast-message"
                            :project {:id "project-1"}
                            :agent "codex"}
                 timeout-id (js/setTimeout (fn []
                                             (set! js/fetch original-fetch)
                                             (is false "messages endpoint blocked on runtime send")
                                             (done))
                                           300)]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-fast-message")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         (and (= "GET" method)
                              (string/includes? url "/v1/sessions/sess-fast-message/events/sse"))
                         (do
                           (swap! calls update :events-sse inc)
                           (let [stream (js/TransformStream.)]
                             (js/Promise.resolve
                              (js/Response.
                               (.-readable stream)
                               #js {:status 200
                                    :headers #js {"content-type" "text/event-stream"}}))))

                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-fast-message/messages"))
                         (do
                           (swap! calls update :send inc)
                           ;; Simulate a very slow/hanging runtime send call.
                           (js/Promise. (fn [_resolve _reject])))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unhandled request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (-> (agent-do/handle-fetch self
                                        (json-request "http://db-sync.local/__session__/init"
                                                      "POST"
                                                      init-body
                                                      headers))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/messages"
                                                               "POST"
                                                               {:message "hello"}
                                                               headers))))
                 (.then (fn [resp]
                          (js/clearTimeout timeout-id)
                          (set! js/fetch original-fetch)
                          (is (= 200 (.-status resp)))
                          (is (= 1 (:create @calls)))
                          (is (= 1 (:send @calls)))
                          (done)))
                 (.catch (fn [error]
                           (js/clearTimeout timeout-id)
                           (set! js/fetch original-fetch)
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest messages-wait-for-events-stream-before-runtime-send-test
  (testing "session runtime send waits until events stream is established"
    (async done
           (let [calls (atom {:create 0
                              :events-sse 0
                              :messages 0
                              :messages-before-stream? false})
                 events-stream-open? (atom false)
                 open-events-stream! (atom nil)
                 original-fetch js/fetch
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"
                          "SANDBOX_AGENT_URL" "http://sandbox.local"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 init-body {:id "sess-stream-ready"
                            :project {:id "project-1"}
                            :agent "codex"}]
             (set! js/fetch
                   (fn [request]
                     (let [url (.-url request)
                           method (.-method request)]
                       (cond
                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-stream-ready")
                              (not (string/includes? url "/messages")))
                         (do
                           (swap! calls update :create inc)
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         (and (= "GET" method)
                              (string/includes? url "/v1/sessions/sess-stream-ready/events/sse"))
                         (do
                           (swap! calls update :events-sse inc)
                           (js/Promise.
                            (fn [resolve _reject]
                              (reset! open-events-stream!
                                      (fn []
                                        (reset! events-stream-open? true)
                                        (resolve
                                         (js/Response.
                                          (.-readable (js/TransformStream.))
                                          #js {:status 200
                                               :headers #js {"content-type" "text/event-stream"}})))))))

                         (and (= "POST" method)
                              (string/includes? url "/v1/sessions/sess-stream-ready/messages")
                              (not (string/includes? url "/messages/stream")))
                         (do
                           (swap! calls update :messages inc)
                           (when-not @events-stream-open?
                             (swap! calls assoc :messages-before-stream? true))
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify #js {:ok true})
                             #js {:status 200
                                  :headers #js {"content-type" "application/json"}})))

                         :else
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:error "unhandled request"})
                           #js {:status 500
                                :headers #js {"content-type" "application/json"}}))))))

             (let [promise (-> (agent-do/handle-fetch self
                                                      (json-request "http://db-sync.local/__session__/init"
                                                                    "POST"
                                                                    init-body
                                                                    headers))
                               (.then (fn [_]
                                        (agent-do/handle-fetch self
                                                               (json-request "http://db-sync.local/__session__/messages"
                                                                             "POST"
                                                                             {:message "quick question"}
                                                                             headers))))
                               (.then (fn [resp]
                                        (is (= 200 (.-status resp)))
                                        (is (= 0 (:messages @calls)))
                                        (if-let [open! @open-events-stream!]
                                          (open!)
                                          (is false "events stream opener missing"))
                                        (js/Promise.resolve nil)))
                               (.then (fn [_]
                                        (js/Promise. (fn [resolve _reject]
                                                       (js/setTimeout resolve 0)))))
                               (.then (fn [_]
                                        (set! js/fetch original-fetch)
                                        (is (= 1 (:create @calls)))
                                        (is (= 1 (:events-sse @calls)))
                                        (is (= 1 (:messages @calls)))
                                        (is (false? (:messages-before-stream? @calls)))
                                        (done))))]
               (.catch promise
                       (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done))))))))

(deftest messages-persists-when-existing-events-near-storage-limit-test
  (testing "message append should retain existing events even with low configured max bytes"
    (async done
           (let [payload (apply str (repeat 1500 "x"))
                 initial-event {:event-id "e1"
                                :session-id "sess-cap"
                                :type "agent.runtime"
                                :ts 1
                                :data {:payload payload}}
                 {:keys [self data]} (make-limited-self #js {"AGENT_SESSION_EVENTS_MAX_BYTES" "256"} 500000)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-cap"
                                 :status "running"
                                 :task {}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (#'agent-do/<put-events! self [initial-event])))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/messages"
                                                               "POST"
                                                               {:message "hello"}
                                                               headers))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/events"
                                                               "GET"
                                                               nil
                                                               {"x-user-id" "user-1"}))))
                 (.then (fn [events-resp]
                          (.then (<json events-resp)
                                 (fn [body]
                                   (let [events (:events body)
                                         meta (js->clj (.get data "events.meta") :keywordize-keys true)]
                                     (is (= (:event-id initial-event)
                                            (:event-id (first events))))
                                     (is (= "audit.log" (:type (last events))))
                                     (is (= {:count 2} meta)))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest get-events-ignores-legacy-events-key-test
  (testing "legacy `events` key should not be used when indexed storage metadata is missing"
    (async done
           (let [legacy-event {:event-id "legacy-e1"
                               :session-id "sess-legacy"
                               :type "agent.runtime"
                               :ts 1
                               :data {:payload "legacy"}}
                 {:keys [self]} (make-limited-self #js {} 500000)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-legacy"
                                 :status "running"
                                 :task {}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          ;; Seed only legacy key; new implementation should ignore it.
                          (.put (.-storage self) "events" (clj->js [legacy-event]))))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/events"
                                                               "GET"
                                                               nil
                                                               headers))))
                 (.then (fn [events-resp]
                          (.then (<json events-resp)
                                 (fn [body]
                                   (is (= [] (:events body)))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest append-event-persists-oversized-event-data-test
  (testing "single oversized event payload should be persisted fully without truncation"
    (async done
           (let [huge-payload (apply str (repeat 5000 "y"))
                 {:keys [self data]} (make-limited-self #js {} 500000)]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-huge"
                                 :status "running"
                                 :task {}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (#'agent-do/<append-event! self {:type "agent.runtime"
                                                           :data {:output huge-payload}
                                                           :ts 2})))
                 (.then (fn [_]
                          (#'agent-do/<get-events self)))
                 (.then (fn [res]
                          (let [events (vec res)
                                first-event (first events)]
                            (is (= "agent.runtime" (:type first-event)))
                            (is (= huge-payload (get-in first-event [:data :output])))
                            (is (not (contains? (:data first-event) :truncated)))
                            (is (= {:count 1}
                                   (js->clj (.get data "events.meta") :keywordize-keys true))))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest append-event-avoids-sqlite-toobig-by-indexed-storage-test
  (testing "large event history should persist without writing one oversized events blob"
    (async done
           (let [payload (apply str (repeat 1200 "z"))
                 {:keys [self data]} (make-limited-self #js {} 5000)]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-many-events"
                                 :status "running"
                                 :task {}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (reduce (fn [promise idx]
                                    (.then promise
                                           (fn [_]
                                             (#'agent-do/<append-event! self {:type "agent.runtime"
                                                                              :data {:payload payload :idx idx}
                                                                              :ts idx}))))
                                  (js/Promise.resolve nil)
                                  (range 8))))
                 (.then (fn [_]
                          (#'agent-do/<get-events self)))
                 (.then (fn [events]
                          (let [meta (js->clj (.get data "events.meta") :keywordize-keys true)]
                            (is (= 8 (count events)))
                            (is (= {:count 8} meta))
                            (is (nil? (.get data "events")))
                            (is (some? (.get data "events.7"))))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-requires-authenticated-user-test
  (testing "session publish endpoint requires x-user-id header"
    (async done
           (let [self (make-self #js {})
                 headers {"content-type" "application/json"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-auth"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "sess-pr-auth"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/pr"
                                                               "POST"
                                                               {:create-pr false
                                                                :head-branch "m14/pr-auth"}
                                                               headers))))
                 (.then (fn [resp]
                          (is (= 401 (.-status resp)))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest snapshot-endpoint-creates-sandbox-snapshot-test
  (testing "session snapshot endpoint creates a manual sandbox snapshot"
    (async done
           (let [snapshot-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-snapshot"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-snapshot"
                                           :session-id "sess-snapshot"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<snapshot-runtime!
                                        (fn [_provider runtime _opts]
                                          (swap! snapshot-calls conj runtime)
                                          (js/Promise.resolve {:snapshot-id "backup-1"}))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/snapshot"
                                                                 "POST"
                                                                 {}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "snapshot-created" (:status body)))
                                   (is (= "backup-1" (:snapshot-id body)))
                                   (is (= 1 (count @snapshot-calls)))
                                   (.then (.get (.-storage self) "session")
                                          (fn [session]
                                            (let [session (js->clj session :keywordize-keys true)
                                                  checkpoint (get-in session [:task :sandbox-checkpoint])]
                                              (is (= "backup-1" (:snapshot-id checkpoint)))
                                              (is (= "cloudflare" (:provider checkpoint)))
                                              (done))))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-push-only-success-test
  (testing "session publish endpoint supports push-only flow"
    (async done
           (let [push-calls (atom [])
                 terminate-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-push-only"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"
                                                  :base-branch "develop"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "sess-pr-push-only"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (swap! push-calls conj opts)
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))
                                        agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr false
                                                                  :head-branch "m14/push-only"
                                                                  :commit-message "feat: summarize PR changes"
                                                                  :force true}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pushed" (:status body)))
                                   (is (= "m14/push-only" (:head-branch body)))
                                   (is (= "develop" (:base-branch body)))
                                   (is (= true (:force body)))
                                   (is (= "m14/push-only" (:head-branch (first @push-calls))))
                                   (is (= "feat: summarize PR changes"
                                          (:commit-message (first @push-calls))))
                                   (is (empty? @terminate-calls))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-push-only-prefers-checkpoint-head-branch-test
  (testing "session publish endpoint push-only uses restored checkpoint branch when head is omitted"
    (async done
           (let [push-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-push-only-checkpoint-branch"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"
                                                  :base-branch "main"}
                                        :sandbox-checkpoint {:bundle-head-branch "feat/restored-pr-branch"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "sess-pr-push-only-checkpoint-branch"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (swap! push-calls conj opts)
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr false
                                                                  :commit-message "chore: update colors"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pushed" (:status body)))
                                   (is (= "feat/restored-pr-branch" (:head-branch body)))
                                   (is (= "main" (:base-branch body)))
                                   (is (= "feat/restored-pr-branch"
                                          (:head-branch (first @push-calls))))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-generates-friendly-unique-head-branch-test
  (testing "session publish endpoint derives head branch from task and summary when creating PR"
    (async done
           (let [push-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 session-id "69a1251a-82ea-4608-a243-fba45c928b9a"]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id session-id
                                 :status "running"
                                 :task {:node-title "Improve sync performance"
                                        :project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "local-dev"
                                           :session-id session-id}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (swap! push-calls conj opts)
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))
                                        source-control/<pr-token!
                                        (fn [_env _repo-url]
                                          (js/Promise.resolve "pr-token"))
                                        source-control/<default-branch!
                                        (fn [_env _token _repo-url]
                                          (js/Promise.resolve "main"))
                                        source-control/<create-pull-request!
                                        (fn [_env _token _repo-url _opts]
                                          (js/Promise.resolve {:url "https://github.com/example/repo/pull/123"
                                                               :id 123}))
                                        agent-do/<cleanup-runtime-after-pr-ready!
                                        (fn [_self _head-branch]
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr true
                                                                  :body "Optimize batch write latency in sync pipeline"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pr-created" (:status body)))
                                   (let [generated-branch (:head-branch body)]
                                     (is (string/starts-with? generated-branch "perf/"))
                                     (is (string/includes? generated-branch "improve-sync-performance"))
                                     (is (re-find #"-69a1251a$" generated-branch))
                                     (is (= generated-branch
                                            (:head-branch (first @push-calls)))))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-fallbacks-base-branch-when-equal-to-head-test
  (testing "session publish endpoint avoids head==base branch when resolving base branch"
    (async done
           (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}
                 same-branch "logseq-agent/same-branch"]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-branch-fallback"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "sess-pr-branch-fallback"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))
                                        source-control/<pr-token!
                                        (fn [_env _repo-url]
                                          (js/Promise.resolve "pr-token"))
                                        source-control/<default-branch!
                                        (fn [_env _token _repo-url]
                                          (js/Promise.resolve same-branch))
                                        source-control/<create-pull-request!
                                        (fn [_env _token _repo-url opts]
                                          (js/Promise.resolve {:url "https://github.com/example/repo/pull/77"
                                                               :id 77
                                                               :base-branch (:base-branch opts)}))
                                        agent-do/<cleanup-runtime-after-pr-ready!
                                        (fn [_self _head-branch]
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr true
                                                                  :head-branch same-branch}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pr-created" (:status body)))
                                   (is (= same-branch (:head-branch body)))
                                   (is (= "main" (:base-branch body)))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-prefers-detected-default-base-branch-for-pr-create-test
  (testing "session publish endpoint uses detected default branch when creating PR"
    (async done
           (let [create-pr-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-default-base"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"
                                                  :base-branch "main"}}
                                 :runtime {:provider "local-dev"
                                           :session-id "sess-pr-default-base"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))
                                        source-control/<pr-token!
                                        (fn [_env _repo-url]
                                          (js/Promise.resolve "pr-token"))
                                        source-control/<default-branch!
                                        (fn [_env _token _repo-url]
                                          (js/Promise.resolve "develop"))
                                        source-control/<create-pull-request!
                                        (fn [_env _token _repo-url opts]
                                          (swap! create-pr-calls conj opts)
                                          (js/Promise.resolve {:url "https://github.com/example/repo/pull/99"
                                                               :id 99
                                                               :base-branch (:base-branch opts)}))
                                        agent-do/<terminate-runtime!
                                        (fn [_self _runtime]
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr true
                                                                  :head-branch "feature/improve-base-detection"
                                                                  :base-branch "main"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pr-created" (:status body)))
                                   (is (= "develop" (:base-branch body)))
                                   (is (= 1 (count @create-pr-calls)))
                                   (is (= "develop" (:base-branch (first @create-pr-calls))))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest pr-endpoint-pr-created-terminates-runtime-test
  (testing "session publish endpoint terminates runtime and clears sandbox runtime when PR is created"
    (async done
           (let [checkpoint-calls (atom [])
                 terminate-calls (atom [])
                 snapshot-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-created"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}
                                        :sandbox-checkpoint {:provider "cloudflare"
                                                             :snapshot-id "checkpoint-existing-pr"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-pr-created"
                                           :session-id "sess-pr-created"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<push-branch!
                                        (fn [_provider _runtime opts]
                                          (js/Promise.resolve
                                           {:head-branch (:head-branch opts)
                                            :repo-url (:repo-url opts)
                                            :force (:force opts)
                                            :remote "origin"}))
                                        source-control/<pr-token!
                                        (fn [_env _repo-url]
                                          (js/Promise.resolve "pr-token"))
                                        source-control/<default-branch!
                                        (fn [_env _token _repo-url]
                                          (js/Promise.resolve "main"))
                                        source-control/<create-pull-request!
                                        (fn [_env _token _repo-url _opts]
                                          (js/Promise.resolve {:url "https://github.com/example/repo/pull/88"
                                                               :id 88}))
                                        agent-do/<checkpoint-existing-snapshot!
                                        (fn [_self _current-session opts]
                                          (swap! checkpoint-calls conj opts)
                                          (js/Promise.resolve true))
                                        runtime-provider/<snapshot-runtime!
                                        (fn [_provider runtime _opts]
                                          (swap! snapshot-calls conj runtime)
                                          (js/Promise.resolve {:snapshot-id "backup-pr-1"}))
                                        agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr true
                                                                  :head-branch "m14/pr-created"
                                                                  :base-branch "main"}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pr-created" (:status body)))
                                   (is (= "https://github.com/example/repo/pull/88" (:pr-url body)))
                                   (.then (.get (.-storage self) "session")
                                          (fn [session]
                                            (let [session (js->clj session :keywordize-keys true)]
                                              (is (= 1 (count @terminate-calls)))
                                              (is (= [{:by "system"
                                                       :reason "pr-ready"
                                                       :head-branch "m14/pr-created"}]
                                                     @checkpoint-calls))
                                              (is (empty? @snapshot-calls))
                                              (is (nil? (:runtime session)))
                                              (is (= "checkpoint-existing-pr"
                                                     (get-in session [:task :sandbox-checkpoint :snapshot-id])))
                                              (is (number? (get-in session [:task :sandbox-checkpoint :checkpoint-at])))
                                              (done))))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest cancel-endpoint-checkpoints-before-terminate-test
  (testing "session cancel checkpoints existing snapshot pointer before terminating runtime"
    (async done
           (let [terminate-calls (atom [])
                 snapshot-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-cancel-checkpoint"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}
                                        :sandbox-checkpoint {:provider "cloudflare"
                                                             :snapshot-id "checkpoint-existing-cancel"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-cancel-checkpoint"
                                           :session-id "sess-cancel-checkpoint"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [runtime-provider/<snapshot-runtime!
                                        (fn [_provider runtime _opts]
                                          (swap! snapshot-calls conj runtime)
                                          (js/Promise.resolve {:snapshot-id "backup-cancel-1"}))
                                        agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/cancel"
                                                                 "POST"
                                                                 nil
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (.get (.-storage self) "session")
                                 (fn [session]
                                   (let [session (js->clj session :keywordize-keys true)]
                                     (is (empty? @snapshot-calls))
                                     (is (= 1 (count @terminate-calls)))
                                     (is (nil? (:runtime session)))
                                     (is (= "checkpoint-existing-cancel"
                                            (get-in session [:task :sandbox-checkpoint :snapshot-id])))
                                     (is (number? (get-in session [:task :sandbox-checkpoint :checkpoint-at])))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest cancel-endpoint-terminates-runtime-when-session-not-running-test
  (testing "session cancel still terminates runtime for completed session"
    (async done
           (let [terminate-calls (atom [])
                 checkpoint-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-cancel-completed"
                                 :status "completed"
                                 :task {:project {:repo-url "https://github.com/example/repo"}
                                        :sandbox-checkpoint {:provider "cloudflare"
                                                             :snapshot-id "checkpoint-existing-completed-cancel"}}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-cancel-completed"
                                           :session-id "sess-cancel-completed"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (with-redefs [agent-do/<checkpoint-existing-snapshot!
                                        (fn [_self current-session opts]
                                          (swap! checkpoint-calls conj {:session-id (:id current-session)
                                                                        :opts opts})
                                          (js/Promise.resolve true))
                                        agent-do/<terminate-runtime!
                                        (fn [_self runtime]
                                          (swap! terminate-calls conj runtime)
                                          (js/Promise.resolve nil))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/cancel"
                                                                 "POST"
                                                                 nil
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (.get (.-storage self) "session")
                                 (fn [session]
                                   (let [session (js->clj session :keywordize-keys true)]
                                     (is (= 1 (count @checkpoint-calls)))
                                     (is (= 1 (count @terminate-calls)))
                                     (is (nil? (:runtime session)))
                                     (is (= "completed" (:status session)))
                                     (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest terminal-endpoint-requires-authenticated-user-test
  (testing "session terminal endpoint requires x-user-id header"
    (async done
           (let [self (make-self #js {})]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-term-auth"
                                 :status "running"
                                 :task {}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-1"
                                           :session-id "sess-term-auth"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/terminal"
                                                               "GET"
                                                               nil
                                                               {}))))
                 (.then (fn [resp]
                          (is (= 401 (.-status resp)))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest terminal-endpoint-runtime-unavailable-test
  (testing "session terminal endpoint returns conflict when runtime is missing"
    (async done
           (let [self (make-self #js {})
                 headers {"x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-term-missing-runtime"
                                 :status "running"
                                 :task {}
                                 :runtime nil
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/terminal"
                                                               "GET"
                                                               nil
                                                               headers))))
                 (.then (fn [resp]
                          (is (= 409 (.-status resp)))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest terminal-endpoint-opens-runtime-terminal-test
  (testing "session terminal endpoint opens runtime terminal and forwards size options"
    (async done
           (let [calls (atom {})
                 session-stub
                 #js {:terminal
                      (fn [request opts]
                        (swap! calls assoc
                               :url (.-url request)
                               :method (.-method request)
                               :opts (js->clj opts :keywordize-keys true))
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
                 self (make-self #js {"Sandbox" sandbox-ns})
                 headers {"x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-term-open"
                                 :status "running"
                                 :task {}
                                 :runtime {:provider "cloudflare"
                                           :sandbox-id "sbx-1"
                                           :session-id "sess-term-open"}
                                 :audit {}
                                 :created-at 0
                                 :updated-at 0}))
                 (.then (fn [_]
                          (agent-do/handle-fetch self
                                                 (json-request "http://db-sync.local/__session__/terminal?cols=120&rows=40"
                                                               "GET"
                                                               nil
                                                               headers))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (is (= "GET" (:method @calls)))
                          (is (= "sess-term-open" (:runtime-session-id @calls)))
                          (is (= 120 (get-in @calls [:opts :cols])))
                          (is (= 40 (get-in @calls [:opts :rows])))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))
