(ns logseq.agents.planning-agent
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn default-state
  [planning-session-id]
  {:planning-session-id planning-session-id
   :messages []
   :updated-at (common/now-ms)})

(defn- ensure-state-shape
  [planning-session-id state]
  (let [messages (if (sequential? (:messages state))
                   (vec (:messages state))
                   [])]
    (cond-> {:planning-session-id planning-session-id
             :messages messages
             :updated-at (common/now-ms)}
      (map? state) (merge (dissoc state :messages :updated-at :planning-session-id)))))

(defn append-message
  [planning-session-id state role content]
  (let [content (non-empty-str content)
        state (ensure-state-shape planning-session-id state)]
    (if-not (string? content)
      state
      (update (assoc state :updated-at (common/now-ms))
              :messages
              (fnil conj [])
              {:id (str (random-uuid))
               :role role
               :content content
               :ts (common/now-ms)}))))

(defn normalize-state
  [planning-session-id state]
  (ensure-state-shape planning-session-id state))

(defn parse-message-content
  [payload]
  (cond
    (string? payload)
    (or (try
          (some-> (js/JSON.parse payload)
                  (js->clj :keywordize-keys true)
                  :content
                  non-empty-str)
          (catch :default _
            nil))
        (non-empty-str payload))

    (map? payload)
    (or (some-> (:content payload) non-empty-str)
        (some-> (:message payload) non-empty-str))

    :else
    nil))

(defn json-response
  [data status]
  (platform/response
   (js/JSON.stringify (clj->js data))
   #js {:status status
        :headers #js {"content-type" "application/json"}}))
