(ns frontend.handler.agent-ui
  "AI UI stream helpers for agent sessions."
  (:require ["ai" :refer [readUIMessageStream]]
            [clojure.string :as string]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- blank->nil [value]
  (when (string? value)
    (let [value (string/trim value)]
      (when-not (string/blank? value) value))))

(defn- session-key [block-uuid]
  (some-> block-uuid str))

(defn- update-session!
  [block-uuid f]
  (state/update-state! :agent/sessions
                       (fn [sessions]
                         (let [key (session-key block-uuid)
                               session (get sessions key {})]
                           (assoc sessions key (f session))))))

(defn- update-session-state!
  [block-uuid data]
  (update-session! block-uuid #(merge % data)))

(defn- session-state [block-uuid]
  (get (state/sub :agent/sessions) (session-key block-uuid)))

(defn- content->text [content]
  (let [text (->> content
                  (keep (fn [part]
                          (when (= "text" (:type part))
                            (or (:text part) ""))))
                  (apply str))]
    (blank->nil text)))

(defn- item-id-from-data [data]
  (let [item (:item data)]
    (or (:item_id data)
        (:item-id data)
        (:itemId data)
        (:item_id item)
        (:item-id item)
        (:itemId item))))

(defn- ensure-ui-stream!
  [block-uuid item-id role]
  (let [session (session-state block-uuid)]
    (when-not (get-in session [:ui-streams item-id])
      (let [controller* (atom nil)
            stream (js/ReadableStream.
                    #js {:start (fn [controller]
                                  (reset! controller* controller))})]
        (update-session! block-uuid
                         (fn [session]
                           (assoc session :ui-streams
                                  (assoc (or (:ui-streams session) {})
                                         item-id {:controller @controller*
                                                  :text-started? false
                                                  :text-delta? false
                                                  :role (or role "assistant")}))))
        (let [ui-stream (readUIMessageStream
                         #js {:message #js {:id item-id
                                            :role (or role "assistant")
                                            :parts #js []}
                              :stream stream
                              :terminateOnError true
                              :onError (fn [error]
                                         (update-session-state!
                                          block-uuid
                                          {:stream-error (str error)}))})
              iter ((aget ui-stream js/Symbol.asyncIterator) ui-stream)]
          (letfn [(step []
                    (p/let [next (.next iter)]
                      (when-not (.-done next)
                        (let [message (js->clj (.-value next) :keywordize-keys true)]
                          (update-session! block-uuid
                                           (fn [session]
                                             (let [messages (assoc (or (:ui-messages session) {}) item-id message)
                                                   order (or (:ui-message-order session) [])
                                                   order (if (some #{item-id} order) order (conj order item-id))]
                                               (assoc session
                                                      :ui-messages messages
                                                      :ui-message-order order)))))
                        (step))))]
            (step)))))))

(defn- enqueue-ui-chunk!
  [block-uuid item-id chunk]
  (when-let [controller (get-in (session-state block-uuid) [:ui-streams item-id :controller])]
    (.enqueue controller (clj->js chunk))))

(defn- close-ui-stream!
  [block-uuid item-id]
  (when-let [controller (get-in (session-state block-uuid) [:ui-streams item-id :controller])]
    (.close controller)))

(defn- ensure-text-start!
  [block-uuid item-id]
  (let [started? (get-in (session-state block-uuid) [:ui-streams item-id :text-started?])]
    (when-not started?
      (update-session! block-uuid
                       (fn [session]
                         (assoc session :ui-streams
                                (update (or (:ui-streams session) {})
                                        item-id #(assoc (or % {}) :text-started? true))))))
    (enqueue-ui-chunk! block-uuid item-id {:type "text-start" :id item-id})))

(defn- mark-text-delta!
  [block-uuid item-id]
  (update-session! block-uuid
                   (fn [session]
                     (assoc session :ui-streams
                            (update (or (:ui-streams session) {})
                                    item-id #(assoc (or % {}) :text-delta? true))))))

(defn handle-ui-event!
  [block-uuid {:keys [type data]}]
  (case type
    "item.started"
    (when-let [item (:item data)]
      (when (= "message" (:kind item))
        (let [item-id (item-id-from-data data)
              role (:role item)]
          (when (string? item-id)
            (ensure-ui-stream! block-uuid item-id role)
            (ensure-text-start! block-uuid item-id)
            (when-let [text (content->text (:content item))]
              (mark-text-delta! block-uuid item-id)
              (enqueue-ui-chunk! block-uuid item-id {:type "text-delta"
                                                     :id item-id
                                                     :delta text}))))))

    "item.delta"
    (let [delta (:delta data)
          item-id (item-id-from-data data)]
      (when (and (string? item-id) (string? delta))
        (ensure-ui-stream! block-uuid item-id "assistant")
        (ensure-text-start! block-uuid item-id)
        (mark-text-delta! block-uuid item-id)
        (enqueue-ui-chunk! block-uuid item-id {:type "text-delta"
                                               :id item-id
                                               :delta delta})))

    "item.completed"
    (when-let [item (:item data)]
      (when (= "message" (:kind item))
        (let [item-id (item-id-from-data data)]
          (when (string? item-id)
            (ensure-ui-stream! block-uuid item-id (:role item))
            (ensure-text-start! block-uuid item-id)
            (when-not (get-in (session-state block-uuid) [:ui-streams item-id :text-delta?])
              (when-let [text (content->text (:content item))]
                (enqueue-ui-chunk! block-uuid item-id {:type "text-delta"
                                                       :id item-id
                                                       :delta text})))
            (enqueue-ui-chunk! block-uuid item-id {:type "text-end" :id item-id})
            (close-ui-stream! block-uuid item-id)))))

    "error"
    (when-let [error-text (or (:message data) (:error data))]
      (enqueue-ui-chunk! block-uuid "error" {:type "error" :errorText (str error-text)}))

    nil))
