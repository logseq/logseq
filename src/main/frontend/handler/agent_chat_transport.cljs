(ns frontend.handler.agent-chat-transport
  "Transport adapter for agent chat UI.

  Converts message send/stream HTTP calls into chunk events consumed by
  `useChat`."
  (:require [clojure.string :as string]
            [frontend.modules.agent-chat.event :as chat-event]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(def ^:private default-idle-timeout-ms 1200)

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed) trimmed))))

(defn- read-field
  [x k]
  (cond
    (map? x)
    (or (get x (keyword k))
        (get x k))

    (some? x)
    (aget x k)

    :else
    nil))

(defn- message-part-text
  [part]
  (when (= "text" (read-field part "type"))
    (or (non-empty-str (read-field part "text"))
        (non-empty-str (read-field part "delta")))))

(defn- ui-message-text
  [message]
  (or (non-empty-str (read-field message "text"))
      (when-let [parts (read-field message "parts")]
        (->> (array-seq parts)
             (keep message-part-text)
             (apply str)
             non-empty-str))))

(defn- normalize-role
  [role]
  (cond
    (keyword? role) (name role)
    (string? role) role
    :else nil))

(defn- last-user-message-text
  [messages]
  (some->> (array-seq (or messages #js []))
           reverse
           (keep (fn [message]
                   (when (= "user" (normalize-role (read-field message "role")))
                     (ui-message-text message))))
           first
           non-empty-str))

(defn- auth-token []
  (some-> (state/get-auth-id-token) non-empty-str))

(defn- auth-headers
  []
  (let [headers (js/Headers.)]
    (when-let [token (auth-token)]
      (.set headers "authorization" (str "Bearer " token)))
    headers))

(defn- parse-sse-frame
  [frame]
  (let [lines (string/split frame #"\n")
        data-lines (keep (fn [line]
                           (when (string/starts-with? line "data:")
                             (string/trim (subs line 5))))
                         lines)
        payload (string/join "\n" data-lines)]
    (when (seq payload)
      (try
        (js->clj (js/JSON.parse payload) :keywordize-keys true)
        (catch :default _
          {:raw payload})))))

(defn- split-sse-frames
  [buffer]
  (loop [remaining (or buffer "")
         frames []]
    (let [idx (.indexOf ^string remaining "\n\n")]
      (if (neg? idx)
        [frames remaining]
        (let [frame (subs remaining 0 idx)
              tail (subs remaining (+ idx 2))]
          (recur tail (conj frames frame)))))))

(defn- write-chunks!
  [writer chunks]
  (reduce (fn [promise chunk]
            (.then promise
                   (fn []
                     (.write writer (clj->js chunk)))))
          (js/Promise.resolve nil)
          chunks))

(defn- chunks->readable-stream
  [chunks]
  (let [ts (js/TransformStream.)
        writer (.getWriter (.-writable ts))]
    (-> (write-chunks! writer chunks)
        (.catch (fn [_] nil))
        (.finally (fn []
                    (try
                      (.close writer)
                      (catch :default _ nil)))))
    (.-readable ts)))

(defn- stream-url
  [base session-id]
  (str base "/sessions/" session-id "/stream"))

(defn- messages-url
  [base session-id]
  (str base "/sessions/" session-id "/messages"))

(defn- runtime-error-message
  [event]
  (let [data (if (map? (:data event)) (:data event) {})]
    (or (non-empty-str (:message data))
        (non-empty-str (chat-event/payload-text data))
        "agent runtime error")))

(defn- item-content-parts
  [payload item]
  (let [content (or (:content item) (:content payload))]
    (when (sequential? content)
      (vec content))))

(defn- tool-error-text
  [value]
  (or (non-empty-str (:error_text value))
      (non-empty-str (:error-text value))
      (non-empty-str (:errorText value))
      (non-empty-str (:error value))
      (non-empty-str (:message value))))

(defn- item-completed-event?
  [event-type]
  (= "item.completed" event-type))

(defn- response-completed-event?
  [event-type]
  (= "response.completed" event-type))

(defn- terminal-session-event?
  [event-type]
  (contains? #{"session.completed" "session.failed" "session.canceled"} event-type))

(defn- ^:large-vars/cleanup-todo start-stream-consumer!
  [{:keys [response writer start-ts idle-timeout-ms abort-signal]}]
  (let [reader (.getReader (.-body response))
        decoder (js/TextDecoder.)
        buffer (atom "")
        started? (atom false)
        text-started? (atom false)
        finished? (atom false)
        idle-timeout-id (atom nil)
        reasoning-id-by-item (atom {})
        active-reasoning-ids (atom #{})
        item-kind-by-item-id (atom {})
        tool-call-id-by-item-id (atom {})
        text-delta-item-ids (atom #{})
        tool-input-started-ids (atom #{})
        tool-input-available-ids (atom #{})
        tool-output-text-by-call (atom {})
        text-part-id (str "text-" (random-uuid))]
    (letfn [(clear-idle-timeout! []
              (when-let [id @idle-timeout-id]
                (js/clearTimeout id)
                (reset! idle-timeout-id nil)))
            (start-chunks! []
              (if @started?
                []
                (do
                  (reset! started? true)
                  [{:type "start"}
                   {:type "start-step"}])))
            (text-start-chunks! []
              (if @text-started?
                []
                (do
                  (reset! text-started? true)
                  [{:type "text-start" :id text-part-id}])))
            (resolve-reasoning-id! [item-id]
              (let [item-key (or (some-> item-id str)
                                 (str "anon-" (random-uuid)))]
                (or (get @reasoning-id-by-item item-key)
                    (let [reasoning-id (str "reasoning-" item-key)]
                      (swap! reasoning-id-by-item assoc item-key reasoning-id)
                      reasoning-id))))
            (item-key [item-id]
              (some-> item-id str non-empty-str))
            (remember-item-kind! [item-id item-kind]
              (let [item-key (item-key item-id)
                    kind (chat-event/normalize-kind item-kind)]
                (when (and (string? item-key) (string? kind))
                  (swap! item-kind-by-item-id assoc item-key kind))))
            (known-item-kind [item-id]
              (let [item-key (item-key item-id)]
                (when (string? item-key)
                  (get @item-kind-by-item-id item-key))))
            (remember-tool-call-id! [item-id tool-call-id]
              (let [item-key (item-key item-id)
                    call-id (some-> tool-call-id str non-empty-str)]
                (when (and (string? item-key) (string? call-id))
                  (swap! tool-call-id-by-item-id assoc item-key call-id))))
            (known-tool-call-id [item-id]
              (let [item-key (item-key item-id)]
                (when (string? item-key)
                  (get @tool-call-id-by-item-id item-key))))
            (reasoning-open-chunks! [item-id]
              (let [reasoning-id (resolve-reasoning-id! item-id)]
                (if (contains? @active-reasoning-ids reasoning-id)
                  []
                  (do
                    (swap! active-reasoning-ids conj reasoning-id)
                    [{:type "reasoning-start" :id reasoning-id}]))))
            (reasoning-delta-chunks! [item-id delta]
              (let [delta (non-empty-str delta)]
                (if-not (string? delta)
                  []
                  (let [reasoning-id (resolve-reasoning-id! item-id)]
                    (vec (concat (start-chunks!)
                                 (reasoning-open-chunks! item-id)
                                 [{:type "reasoning-delta"
                                   :id reasoning-id
                                   :delta delta}]))))))
            (reasoning-final-chunks! [item-id text]
              (let [reasoning-id (resolve-reasoning-id! item-id)
                    was-active? (contains? @active-reasoning-ids reasoning-id)
                    text (non-empty-str text)]
                (cond
                  (and (not was-active?) (nil? text))
                  []

                  :else
                  (do
                    (swap! active-reasoning-ids disj reasoning-id)
                    (vec (concat (start-chunks!)
                                 (if was-active?
                                   []
                                   [{:type "reasoning-start" :id reasoning-id}])
                                 (if (string? text)
                                   [{:type "reasoning-delta" :id reasoning-id :delta text}]
                                   [])
                                 [{:type "reasoning-end" :id reasoning-id}]))))))
            (close-all-reasoning-chunks! []
              (let [reasoning-ids (vec @active-reasoning-ids)]
                (reset! active-reasoning-ids #{})
                (mapv (fn [reasoning-id]
                        {:type "reasoning-end" :id reasoning-id})
                      reasoning-ids)))
            (resolve-tool-call-id [item-id value]
              (or (some-> (chat-event/tool-call-id value) str non-empty-str)
                  (known-tool-call-id item-id)
                  (some-> item-id str)
                  (str "tool-call-" (random-uuid))))
            (tool-input-available-once-chunks! [item-id value]
              (let [tool-call-id (resolve-tool-call-id item-id value)
                    tool-name (or (chat-event/tool-name value) "tool")
                    input (or (chat-event/tool-input value) {})
                    _ (remember-tool-call-id! item-id tool-call-id)]
                (if (contains? @tool-input-available-ids tool-call-id)
                  []
                  (do
                    (swap! tool-input-available-ids conj tool-call-id)
                    [{:type "tool-input-available"
                      :toolCallId tool-call-id
                      :toolName tool-name
                      :input input}]))))
            (tool-input-start-chunks! [tool-call-id tool-name]
              (if (contains? @tool-input-started-ids tool-call-id)
                []
                (do
                  (swap! tool-input-started-ids conj tool-call-id)
                  [{:type "tool-input-start"
                    :toolCallId tool-call-id
                    :toolName tool-name}])))
            (tool-input-delta-chunks! [item-id value delta]
              (let [delta (non-empty-str delta)]
                (if-not (string? delta)
                  []
                  (let [tool-call-id (resolve-tool-call-id item-id value)
                        tool-name (or (chat-event/tool-name value) "tool")]
                    (vec (concat (start-chunks!)
                                 (tool-input-start-chunks! tool-call-id tool-name)
                                 [{:type "tool-input-delta"
                                   :toolCallId tool-call-id
                                   :inputTextDelta delta}]))))))
            (tool-input-available-chunks! [item-id value]
              (vec (concat (start-chunks!)
                           (tool-input-available-once-chunks! item-id value))))
            (tool-output-chunks! [item-id value]
              (let [tool-call-id (resolve-tool-call-id item-id value)
                    _ (remember-tool-call-id! item-id tool-call-id)
                    error-text (tool-error-text value)
                    output (or (chat-event/tool-output value)
                               (get @tool-output-text-by-call tool-call-id)
                               (some-> (chat-event/payload-text value) chat-event/parse-json-safe))]
                (vec (concat (start-chunks!)
                             (tool-input-available-once-chunks! item-id value)
                             (if (string? error-text)
                               [{:type "tool-output-error"
                                 :toolCallId tool-call-id
                                 :errorText error-text}]
                               [{:type "tool-output-available"
                                 :toolCallId tool-call-id
                                 :output output}])))))
            (text-delta-chunks! [delta]
              (let [delta (non-empty-str delta)]
                (if-not (string? delta)
                  []
                  (vec (concat (start-chunks!)
                               (text-start-chunks!)
                               [{:type "text-delta"
                                 :id text-part-id
                                 :delta delta}])))))
            (event-chunks-for-content-part! [item-id idx part]
              (let [part-kind (chat-event/content-part-kind part)
                    nested-item-id (str (or item-id "item") "-" idx)]
                (cond
                  (= "text" part-kind)
                  (text-delta-chunks! (chat-event/content-part-text part))

                  (= "reasoning" part-kind)
                  (reasoning-final-chunks! nested-item-id (chat-event/content-part-text part))

                  (= "tool-call" part-kind)
                  (tool-input-available-chunks! item-id part)

                  (= "tool-result" part-kind)
                  (tool-output-chunks! item-id part)

                  :else
                  [])))
            (item-completed-chunks! [payload item item-id]
              (let [item-key (item-key item-id)
                    emitted-text-delta? (and (string? item-key)
                                             (contains? @text-delta-item-ids item-key))
                    parts (item-content-parts payload item)]
                (if (seq parts)
                  (reduce (fn [chunks [idx part]]
                            (let [part-kind (chat-event/content-part-kind part)]
                              (if (and emitted-text-delta?
                                       (= "text" part-kind))
                                chunks
                                (into chunks (event-chunks-for-content-part! item-id idx part)))))
                          []
                          (map-indexed vector parts))
                  (let [item-kind (or (chat-event/event-item-kind payload item)
                                      (known-item-kind item-id))
                        merged (merge (if (map? payload) payload {})
                                      (if (map? item) item {}))]
                    (cond
                      (= "reasoning" item-kind)
                      (reasoning-final-chunks! item-id (or (chat-event/payload-text item)
                                                           (chat-event/payload-text payload)))

                      (= "tool-call" item-kind)
                      (tool-input-available-chunks! item-id merged)

                      (= "tool-result" item-kind)
                      (tool-output-chunks! item-id merged)

                      emitted-text-delta?
                      []

                      :else
                      (text-delta-chunks! (or (chat-event/payload-text item)
                                              (chat-event/payload-text payload))))))))
            (<write-event-chunks! [chunks]
              (if (seq chunks)
                (do
                  (reset-idle-timeout!)
                  (write-chunks! writer chunks))
                (js/Promise.resolve nil)))
            (finish! []
              (when-not @finished?
                (reset! finished? true)
                (clear-idle-timeout!)
                (let [chunks (if @started?
                               (vec (concat (close-all-reasoning-chunks!)
                                            (if @text-started?
                                              [{:type "text-end" :id text-part-id}]
                                              [])
                                            [{:type "finish-step"}
                                             {:type "finish"}]))
                               [{:type "finish"}])]
                  (-> (write-chunks! writer chunks)
                      (.catch (fn [_] nil))
                      (.finally (fn []
                                  (try (.cancel reader) (catch :default _ nil))
                                  (try (.close writer) (catch :default _ nil))))))))
            (reset-idle-timeout! []
              (clear-idle-timeout!)
              (reset! idle-timeout-id
                      (js/setTimeout
                       (fn []
                         (finish!))
                       idle-timeout-ms)))
            (<handle-event!
              [event]
              (let [event-type (:type event)
                    event-ts (:ts event)]
                (if (or (not (number? event-ts))
                        (<= event-ts start-ts)
                        @finished?)
                  (js/Promise.resolve nil)
                  (let [data (:data event)
                        payload (chat-event/unwrap-event-payload
                                 {:data (if (map? data) data {})})
                        item (:item payload)
                        item-id (chat-event/event-item-id {} payload item)]
                    (cond
                      (= event-type "agent.runtime.error")
                      (-> (write-chunks! writer [{:type "error"
                                                  :errorText (runtime-error-message event)}])
                          (.finally (fn [] (finish!))))

                      (terminal-session-event? event-type)
                      (-> (if (= event-type "session.completed")
                            (js/Promise.resolve nil)
                            (write-chunks! writer [{:type "error"
                                                    :errorText event-type}]))
                          (.finally (fn [] (finish!))))

                      (= event-type "item.started")
                      (let [item-kind (or (chat-event/event-item-kind payload item)
                                          (known-item-kind item-id))
                            merged (merge (if (map? payload) payload {})
                                          (if (map? item) item {}))
                            _ (remember-item-kind! item-id item-kind)
                            chunks (cond
                                     (= "tool-result" item-kind)
                                     (vec (concat (start-chunks!)
                                                  (tool-input-available-once-chunks! item-id merged)))

                                     :else
                                     [])]
                        (<write-event-chunks! chunks))

                      (chat-event/delta-event? event-type)
                      (let [delta (non-empty-str (chat-event/payload-text payload))
                            item-kind (or (chat-event/event-item-kind payload item)
                                          (known-item-kind item-id))
                            item-key (item-key item-id)
                            merged (merge (if (map? payload) payload {})
                                          (if (map? item) item {}))
                            tool-call-id (resolve-tool-call-id item-id merged)
                            known-tool-call? (contains? @tool-input-available-ids tool-call-id)
                            tool-result-like? (or (= "tool-result" item-kind)
                                                  known-tool-call?)
                            _ (remember-item-kind! item-id item-kind)
                            chunks (cond
                                     (and (= "reasoning" item-kind) (string? delta))
                                     (reasoning-delta-chunks! item-id delta)

                                     (and (= "tool-call" item-kind) (string? delta))
                                     (tool-input-delta-chunks! item-id merged delta)

                                     (and tool-result-like? (string? delta))
                                     (let [previous (or (get @tool-output-text-by-call tool-call-id) "")
                                           next-output (str previous delta)]
                                       (swap! tool-output-text-by-call assoc tool-call-id next-output)
                                       (vec (concat (start-chunks!)
                                                    (tool-input-available-once-chunks! item-id merged)
                                                    [{:type "tool-output-available"
                                                      :toolCallId tool-call-id
                                                      :output next-output
                                                      :preliminary true}])))

                                     (string? delta)
                                     (text-delta-chunks! delta)

                                     :else
                                     [])]
                        (when (and (string? item-key)
                                   (= item-kind nil)
                                   (string? delta))
                          (swap! text-delta-item-ids conj item-key))
                        (when (and (string? item-key)
                                   (contains? #{"message" "text"} item-kind)
                                   (string? delta))
                          (swap! text-delta-item-ids conj item-key))
                        (<write-event-chunks! chunks))

                      (item-completed-event? event-type)
                      (let [chunks (item-completed-chunks! payload item item-id)]
                        (<write-event-chunks! chunks))

                      (response-completed-event? event-type)
                      (let [chunks (item-completed-chunks! payload item item-id)]
                        (-> (<write-event-chunks! chunks)
                            (.finally (fn [] (finish!)))))

                      :else
                      (js/Promise.resolve nil))))))
            (<drain-frames!
              [frames]
              (reduce (fn [promise frame]
                        (.then promise
                               (fn []
                                 (if-let [event (parse-sse-frame frame)]
                                   (<handle-event! event)
                                   (js/Promise.resolve nil)))))
                      (js/Promise.resolve nil)
                      frames))
            (<step! []
              (if @finished?
                (js/Promise.resolve nil)
                (p/let [result (.read reader)]
                  (if (or @finished? (.-done result))
                    (finish!)
                    (let [chunk (.decode decoder (.-value result) #js {:stream true})
                          chunk (string/replace chunk #"\r\n" "\n")
                          merged (str @buffer chunk)
                          [frames remainder] (split-sse-frames merged)]
                      (reset! buffer remainder)
                      (p/let [_ (<drain-frames! frames)]
                        (<step!)))))))]
      (when abort-signal
        (.addEventListener abort-signal "abort" (fn [] (finish!))))
      (-> (<step!)
          (p/catch (fn [error]
                     (if (or @finished?
                             (= "AbortError" (some-> error (aget "name"))))
                       (finish!)
                       (-> (write-chunks! writer [{:type "error"
                                                   :errorText (str error)}])
                           (.finally (fn [] (finish!)))))))
          (.finally (fn [] nil))))))

(defn- send-messages!
  [{:keys [base session-id fetch-fn now-fn idle-timeout-ms open-stream?]} opts]
  (let [message (last-user-message-text (aget opts "messages"))]
    (if-not (and (string? base) (string? session-id))
      (js/Promise.reject
       (js/Error. "agent chat transport is missing base/session id"))
      (if-not (string? message)
        (js/Promise.reject (js/Error. "empty user message"))
        (let [fetch-fn (or fetch-fn js/fetch)
              now-fn (or now-fn util/time-ms)
              start-ts (now-fn)
              abort-signal (aget opts "abortSignal")
              headers (auth-headers)
              post-url (messages-url base session-id)
              stream-endpoint (stream-url base session-id)]
          (-> (p/let [post-resp (fetch-fn post-url
                                          #js {:method "POST"
                                               :headers headers
                                               :signal abort-signal
                                               :body (js/JSON.stringify
                                                      #js {:message message
                                                           :kind "user"})})
                      _ (when-not (.-ok post-resp)
                          (throw (js/Error. (str "send message failed: " (.-status post-resp)))))]
                (if (false? open-stream?)
                  (chunks->readable-stream [{:type "finish"}])
                  (p/let [stream-resp (fetch-fn stream-endpoint
                                                #js {:method "GET"
                                                     :headers headers
                                                     :signal abort-signal})
                          _ (when-not (.-ok stream-resp)
                              (throw (js/Error. (str "open stream failed: " (.-status stream-resp)))))
                          _ (when-not (.-body stream-resp)
                              (throw (js/Error. "stream response has no body")))]
                    (let [ts (js/TransformStream.)
                          writer (.getWriter (.-writable ts))]
                      (start-stream-consumer! {:response stream-resp
                                               :writer writer
                                               :start-ts start-ts
                                               :idle-timeout-ms (or idle-timeout-ms default-idle-timeout-ms)
                                               :abort-signal abort-signal})
                      (.-readable ts)))))
              (.catch (fn [error]
                        (js/Promise.reject error)))))))))

(defn make-transport
  [{:keys [base session-id fetch-fn now-fn idle-timeout-ms open-stream?]}]
  #js {:sendMessages (fn [opts]
                       (send-messages! {:base base
                                        :session-id session-id
                                        :fetch-fn fetch-fn
                                        :now-fn now-fn
                                        :idle-timeout-ms idle-timeout-ms
                                        :open-stream? open-stream?}
                                       opts))
       :reconnectToStream (fn [_opts]
                            (js/Promise.resolve nil))})
