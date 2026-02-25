(ns frontend.modules.agent-chat.event
  (:require [clojure.string :as string]))

(defn non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed) trimmed))))

(defn payload-text
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

(defn normalize-kind
  [value]
  (when-let [kind (cond
                    (keyword? value) (name value)
                    (string? value) value
                    :else nil)]
    (-> kind
        string/trim
        string/lower-case
        (string/replace #"[_\s]+" "-")
        non-empty-str)))

(defn parse-json-safe
  [value]
  (if (string? value)
    (try
      (js->clj (js/JSON.parse value) :keywordize-keys true)
      (catch :default _
        value))
    value))

(defn status-part-label
  [part]
  (some-> (or (:label part)
              (:status-label part)
              (:status_label part))
          str
          non-empty-str
          string/lower-case))

(defn status-part-detail
  [part]
  (let [detail (:detail part)]
    (cond
      (map? detail) detail
      (string? detail) (let [parsed (parse-json-safe detail)]
                         (when (map? parsed) parsed))
      :else nil)))

(defn status-error-message
  [part]
  (let [label (status-part-label part)
        detail (status-part-detail part)
        error-value (:error detail)
        error-message (cond
                        (map? error-value)
                        (or (non-empty-str (:message error-value))
                            (non-empty-str (:error error-value))
                            (non-empty-str (:codexErrorInfo error-value)))
                        (string? error-value) (non-empty-str error-value)
                        :else nil)
        detail-message (or error-message
                           (non-empty-str (:message detail))
                           (non-empty-str (:error_message detail))
                           (non-empty-str (:error-message detail)))
        failed-status? (= "failed" (normalize-kind (:status detail)))
        failed-turn-label? (contains? #{"turn.completed" "turn.failed" "turn.error"} label)]
    (cond
      (string? detail-message)
      detail-message

      (and failed-status? failed-turn-label?)
      "Agent turn failed."

      :else nil)))

(defn unwrap-event-payload
  [event]
  (loop [payload (let [data (:data event)]
                   (if (map? data) data {}))]
    (if (and (map? (:data payload))
             (or (contains? payload :raw)
                 (contains? payload :time)
                 (contains? payload :source)
                 (contains? payload :event_id)
                 (contains? payload :event-id)
                 (contains? payload :session_id)
                 (contains? payload :session-id)
                 (contains? payload :native_session_id)
                 (contains? payload :native-session-id)
                 (contains? payload :sequence)
                 (contains? payload :synthetic)
                 (and (= 1 (count payload))
                      (contains? payload :data))))
      (recur (:data payload))
      payload)))

(defn event-item-id
  [event payload item]
  (when-not (or (:item_id item)
                (:item_id payload)
                (:event-id event))
    (throw (ex-info
            "wrong event without id"
            {:event event
             :payload payload
             :item item})))
  (or (:item_id item)
      (:item_id payload)
      (:event-id event)))

(defn event-item-kind
  [payload item]
  (or (normalize-kind (or (:kind item) (:type item)))
      (normalize-kind (or (:item-kind payload)
                          (:item_kind payload)
                          (:itemKind payload)
                          (:kind payload)
                          (:type payload)))))

(defn content-part-kind
  [part]
  (normalize-kind (or (:type part) (:kind part))))

(defn content-part-text
  [part]
  (or (non-empty-str (:text part))
      (non-empty-str (:content part))
      (non-empty-str (:delta part))
      (non-empty-str (payload-text part))))

(defn tool-call-id
  [value]
  (or (:tool_call_id value)
      (:native_item_id value)))

(defn tool-name
  [value]
  (:tool_name value))

(defn tool-input
  [value]
  (let [input-from-content (some->> (:content value)
                                    (keep (fn [part]
                                            (when (= "json" (content-part-kind part))
                                              (:json part))))
                                    first)
        input (or (:input value)
                  (:arguments value)
                  (:args value)
                  (:tool_input value)
                  (:tool-input value)
                  (:toolInput value)
                  input-from-content)]
    (when (some? input)
      (parse-json-safe input))))

(defn tool-output
  [value]
  (let [output-from-content (some->> (:content value)
                                     (keep (fn [part]
                                             (when (= "json" (content-part-kind part))
                                               (:json part))))
                                     first)
        output (or (:output value)
                   (:result value)
                   (:tool_output value)
                   (:tool-output value)
                   (:toolOutput value)
                   output-from-content)]
    (when (some? output)
      (parse-json-safe output))))

(defn delta-event?
  [event-type]
  (and (string? event-type)
       (or (= "item.delta" event-type)
           (string/includes? event-type ".delta"))))
