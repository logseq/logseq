(ns logseq.db-sync.agent-do-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.db-sync.worker.agent.do :as agent-do]))

(defn- make-agent-storage []
  (let [data (js/Map.)]
    #js {:get (fn [k]
                (js/Promise.resolve (.get data k)))
         :put (fn [k v]
                (.set data k v)
                (js/Promise.resolve nil))}))

(defn- make-self [env]
  #js {:env env
       :storage (make-agent-storage)
       :streams (js/Map.)})

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
                          (.put (.-storage self) "events" #js [])))
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
