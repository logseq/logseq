(ns frontend.handler.agent-chat-transport
  (:require [clojure.string :as string]
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
              rest (subs remaining (+ idx 2))]
          (recur rest (conj frames frame)))))))

(defn- payload-text
  [payload]
  (cond
    (string? payload) payload
    (string? (:delta payload)) (:delta payload)
    (string? (:text payload)) (:text payload)
    (string? (:message payload)) (:message payload)
    (string? (:content payload)) (:content payload)
    (string? (:output_text payload)) (:output_text payload)
    (string? (:raw payload)) (:raw payload)
    (seq (:content payload))
    (->> (:content payload)
         (keep (fn [part]
                 (when (= "text" (:type part))
                   (:text part))))
         (apply str)
         non-empty-str)
    :else nil))

(defn- event-item-id
  [payload item]
  (or (:item_id item)
      (:item-id item)
      (:itemId item)
      (:item_id payload)
      (:item-id payload)
      (:itemId payload)))

(defn- write-chunks!
  [writer chunks]
  (reduce (fn [promise chunk]
            (.then promise
                   (fn []
                     (.write writer (clj->js chunk)))))
          (js/Promise.resolve nil)
          chunks))

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
        (non-empty-str (payload-text data))
        "agent runtime error")))

(defn- completed-event?
  [event-type]
  (contains? #{"item.completed" "response.completed"} event-type))

(defn- delta-event?
  [event-type]
  (and (string? event-type)
       (or (= "item.delta" event-type)
           (string/includes? event-type ".delta"))))

(defn- terminal-session-event?
  [event-type]
  (contains? #{"session.completed" "session.failed" "session.canceled"} event-type))

(defn- start-stream-consumer!
  [{:keys [response writer start-ts idle-timeout-ms abort-signal]}]
  (let [reader (.getReader (.-body response))
        decoder (js/TextDecoder.)
        buffer (atom "")
        started? (atom false)
        finished? (atom false)
        idle-timeout-id (atom nil)
        active-item-id (atom nil)
        text-part-id (str "text-" (random-uuid))]
    (letfn [(clear-idle-timeout! []
              (when-let [id @idle-timeout-id]
                (js/clearTimeout id)
                (reset! idle-timeout-id nil)))
            (finish! []
              (when-not @finished?
                (reset! finished? true)
                (clear-idle-timeout!)
                (-> (if @started?
                      (write-chunks! writer [{:type "text-end" :id text-part-id}
                                             {:type "finish-step"}
                                             {:type "finish"}])
                      (write-chunks! writer [{:type "finish"}]))
                    (.catch (fn [_] nil))
                    (.finally (fn []
                                (try (.cancel reader) (catch :default _ nil))
                                (try (.close writer) (catch :default _ nil)))))))
            (reset-idle-timeout! []
              (clear-idle-timeout!)
              (reset! idle-timeout-id
                      (js/setTimeout
                       (fn []
                         (finish!))
                       idle-timeout-ms)))
            (<ensure-start! []
              (if @started?
                (js/Promise.resolve nil)
                (do
                  (reset! started? true)
                  (write-chunks! writer [{:type "start"}
                                         {:type "start-step"}
                                         {:type "text-start" :id text-part-id}]))))
            (matching-item-id?
              [item-id]
              (or (nil? @active-item-id)
                  (nil? item-id)
                  (= @active-item-id item-id)))
            (<handle-event!
              [event]
              (let [event-type (:type event)
                    event-ts (:ts event)]
                (if (or (not (number? event-ts))
                        (<= event-ts start-ts)
                        @finished?)
                  (js/Promise.resolve nil)
                  (let [data (:data event)
                        payload (if (map? data)
                                  (or (:data data) data)
                                  {})
                        item (:item payload)
                        item-id (event-item-id payload item)]
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

                      (delta-event? event-type)
                      (let [delta (non-empty-str (payload-text payload))]
                        (if (or (nil? delta)
                                (not (matching-item-id? item-id)))
                          (js/Promise.resolve nil)
                          (do
                            (when (and (nil? @active-item-id) (string? item-id))
                              (reset! active-item-id item-id))
                            (-> (<ensure-start!)
                                (.then (fn []
                                         (reset-idle-timeout!)
                                         (write-chunks! writer [{:type "text-delta"
                                                                 :id text-part-id
                                                                 :delta delta}])))
                                (.catch (fn [_] nil))))))

                      (completed-event? event-type)
                      (if-not (matching-item-id? item-id)
                        (js/Promise.resolve nil)
                        (let [text (or (non-empty-str (payload-text item))
                                       (non-empty-str (payload-text payload)))]
                          (when (and (nil? @active-item-id) (string? item-id))
                            (reset! active-item-id item-id))
                          (-> (if (and (not @started?) (string? text))
                                (-> (<ensure-start!)
                                    (.then (fn []
                                             (write-chunks! writer [{:type "text-delta"
                                                                     :id text-part-id
                                                                     :delta text}])))
                                    (.catch (fn [_] nil)))
                                (js/Promise.resolve nil))
                              (.finally (fn [] (finish!))))))

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
  [{:keys [base session-id fetch-fn now-fn idle-timeout-ms]} opts]
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
              stream-url (stream-url base session-id)]
          (-> (p/let [post-resp (fetch-fn post-url
                                          #js {:method "POST"
                                               :headers headers
                                               :signal abort-signal
                                               :body (js/JSON.stringify
                                                      #js {:message message
                                                           :kind "user"})})
                      _ (when-not (.-ok post-resp)
                          (throw (js/Error. (str "send message failed: " (.-status post-resp)))))
                      stream-resp (fetch-fn stream-url
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
                  (.-readable ts)))
              (.catch (fn [error]
                        (js/Promise.reject error)))))))))

(defn make-transport
  [{:keys [base session-id fetch-fn now-fn idle-timeout-ms]}]
  #js {:sendMessages (fn [opts]
                       (send-messages! {:base base
                                        :session-id session-id
                                        :fetch-fn fetch-fn
                                        :now-fn now-fn
                                        :idle-timeout-ms idle-timeout-ms}
                                       opts))
       :reconnectToStream (fn [_opts]
                            (js/Promise.resolve nil))})
