(ns logseq.db-sync.agent-do-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.db-sync.worker.agent.do :as agent-do]
            [logseq.db-sync.worker.agent.runtime-provider :as runtime-provider]
            [logseq.db-sync.worker.agent.source-control :as source-control]))

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

(deftest pr-endpoint-push-only-success-test
  (testing "session publish endpoint supports push-only flow"
    (async done
           (let [push-calls (atom [])
                 env #js {"AGENT_RUNTIME_PROVIDER" "local-dev"}
                 self (make-self env)
                 headers {"content-type" "application/json"
                          "x-user-id" "user-1"}]
             (-> (.put (.-storage self)
                       "session"
                       (clj->js {:id "sess-pr-push-only"
                                 :status "running"
                                 :task {:project {:repo-url "https://github.com/example/repo"}}
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
                                            :remote "origin"}))]
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
                                   (is (= true (:force body)))
                                   (is (= "feat: summarize PR changes"
                                          (:commit-message (first @push-calls))))
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
                                        source-control/pr-token
                                        (fn [_env] "token-1")
                                        source-control/<default-branch!
                                        (fn [_env _token _repo-url]
                                          (js/Promise.resolve same-branch))]
                            (agent-do/handle-fetch self
                                                   (json-request "http://db-sync.local/__session__/pr"
                                                                 "POST"
                                                                 {:create-pr false
                                                                  :head-branch same-branch}
                                                                 headers)))))
                 (.then (fn [resp]
                          (is (= 200 (.-status resp)))
                          (.then (<json resp)
                                 (fn [body]
                                   (is (= "pushed" (:status body)))
                                   (is (= same-branch (:head-branch body)))
                                   (is (= "main" (:base-branch body)))
                                   (done)))))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))
