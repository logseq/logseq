(ns frontend.handler.agent-chat-transport
  "Chat transport for agent sessions using AI SDK UIMessageChunk streaming."
  (:require [clojure.string :as string]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- stream-url [base session-id]
  (str base "/sessions/" session-id "/stream"))

(defn- message-url [base session-id]
  (str base "/sessions/" session-id "/messages"))

(defn- blank->nil [value]
  (when (string? value)
    (let [value (string/trim value)]
      (when-not (string/blank? value) value))))

(defn- message-text [^js msg]
  (let [parts (.-parts msg)
        total (.-length parts)]
    (loop [idx 0
           acc ""]
      (if (>= idx total)
        (blank->nil acc)
        (let [part (aget parts idx)]
          (recur (inc idx)
                 (if (= "text" (.-type part))
                   (str acc (or (.-text part) ""))
                   acc)))))))

(defn- parse-sse-frame [frame]
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

(defn- split-sse-frames [buffer]
  (loop [remaining buffer
         frames []]
    (let [idx (.indexOf ^string remaining "\n\n")]
      (if (neg? idx)
        [frames remaining]
        (let [frame (subs remaining 0 idx)
              rest (subs remaining (+ idx 2))]
          (recur rest (conj frames frame)))))))

(defn- item-id [data]
  (let [item (:item data)]
    (or (:item_id data)
        (:item-id data)
        (:itemId data)
        (:item_id item)
        (:item-id item)
        (:itemId item))))

(defn- content->text [content]
  (let [text (->> content
                  (keep (fn [part]
                          (when (= "text" (:type part))
                            (or (:text part) ""))))
                  (apply str))]
    (blank->nil text)))

(defn- emit-chunk! [controller chunk]
  (.enqueue controller (clj->js chunk)))

(defn- stream-ui-chunks
  [{:keys [base session-id known-ids abort-signal]}]
  (let [known-ids (set known-ids)
        state* (atom {})
        stream (js/ReadableStream.
                #js {:start
                     (fn [controller]
                       (let [headers (auth-headers)
                             opts (cond-> {:method "GET"}
                                    (some? abort-signal) (assoc :signal abort-signal)
                                    headers (assoc :headers headers))]
                         (-> (p/let [resp (js/fetch (stream-url base session-id)
                                                    (clj->js opts))]
                               (when-not (.-ok resp)
                                 (throw (ex-info "agent stream failed"
                                                 {:status (.-status resp)})))
                               (let [reader (.getReader (.-body resp))
                                     decoder (js/TextDecoder.)
                                     buffer (atom "")]
                                 (letfn [(ensure-start! [item-id]
                                           (when-not (get-in @state* [item-id :started?])
                                             (swap! state* assoc-in [item-id :started?] true)
                                             (emit-chunk! controller {:type "text-start" :id item-id})))
                                         (mark-delta! [item-id]
                                           (swap! state* assoc-in [item-id :delta?] true))
                                         (assistant-role? [item]
                                           (= "assistant" (:role item)))
                                         (emit-event! [event]
                                           (let [{:keys [type data]} event
                                                 item (:item data)
                                                 item-id (item-id data)
                                                 role (or (:role item) (get-in @state* [item-id :role]))]
                                             (when (and item-id role)
                                               (swap! state* assoc-in [item-id :role] role))
                                             (when (and (string? item-id) (contains? known-ids item-id))
                                               (swap! state* assoc-in [item-id :known?] true))
                                             (case type
                                               "item.started"
                                               (when (and (string? item-id)
                                                          (= "message" (:kind item))
                                                          (assistant-role? item)
                                                          (not (get-in @state* [item-id :known?])))
                                                 (ensure-start! item-id)
                                                 (when-let [text (content->text (:content item))]
                                                   (mark-delta! item-id)
                                                   (emit-chunk! controller {:type "text-delta"
                                                                            :id item-id
                                                                            :delta text})))

                                               "item.delta"
                                               (when (and (string? item-id)
                                                          (string? (:delta data))
                                                          (not (get-in @state* [item-id :known?])))
                                                 (when (or (nil? role) (= "assistant" role))
                                                   (ensure-start! item-id)
                                                   (mark-delta! item-id)
                                                   (emit-chunk! controller {:type "text-delta"
                                                                            :id item-id
                                                                            :delta (:delta data)})))

                                               "item.completed"
                                               (when (and (string? item-id)
                                                          (= "message" (:kind item))
                                                          (assistant-role? item)
                                                          (not (get-in @state* [item-id :known?])))
                                                 (ensure-start! item-id)
                                                 (when-not (get-in @state* [item-id :delta?])
                                                   (when-let [text (content->text (:content item))]
                                                     (emit-chunk! controller {:type "text-delta"
                                                                              :id item-id
                                                                              :delta text})))
                                                 (emit-chunk! controller {:type "text-end" :id item-id}))

                                               "error"
                                               (when-let [error-text (or (:message data) (:error data))]
                                                 (emit-chunk! controller {:type "error"
                                                                          :errorText (str error-text)}))

                                               nil)))
                                         (step []
                                           (p/let [result (.read reader)]
                                             (if (.-done result)
                                               (.close controller)
                                               (let [chunk (.decode decoder (.-value result) #js {:stream true})
                                                     chunk (string/replace chunk #"\r\n" "\n")
                                                     merged (str @buffer chunk)
                                                     [frames remainder] (split-sse-frames merged)]
                                                 (reset! buffer remainder)
                                                 (doseq [frame frames]
                                                   (when-let [event (parse-sse-frame frame)]
                                                     (emit-event! event)))
                                                 (step)))))]
                                   (step))))
                             (p/catch (fn [error]
                                        (.error controller error))))))})]
    stream))

(defn make-transport
  [{:keys [base session-id known-ids]}]
  (clj->js
   {:sendMessages
    (fn [options]
      (let [messages (.-messages options)
            total (.-length messages)
            last-message (when (pos? total) (aget messages (dec total)))
            text (when last-message (message-text last-message))]
        (if-not (string? text)
          (js/Promise.reject (js/Error. "Missing message text"))
          (p/let [_ (db-sync/fetch-json (message-url base session-id)
                                        {:method "POST"
                                         :headers {"content-type" "application/json"}
                                         :body (js/JSON.stringify (clj->js {:message text
                                                                            :kind "user"}))}
                                        {:response-schema :sessions/message})]
            (stream-ui-chunks {:base base
                               :session-id session-id
                               :known-ids known-ids
                               :abort-signal (.-abortSignal options)})))))

    :reconnectToStream
    (fn [options]
      (js/Promise.resolve
       (stream-ui-chunks {:base base
                          :session-id session-id
                          :known-ids known-ids
                          :abort-signal (.-abortSignal options)})))}))
