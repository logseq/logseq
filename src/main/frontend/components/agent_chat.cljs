(ns frontend.components.agent-chat
  (:require [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- ui-message-text
  [message]
  (let [parts (:parts message)]
    (when (seq parts)
      (let [text (->> parts
                      (keep (fn [part]
                              (when (= "text" (:type part))
                                (:text part))))
                      (apply str)
                      (string/trim))]
        (when-not (string/blank? text)
          text)))))

(defn- normalize-role [role]
  (cond
    (keyword? role) (name role)
    (string? role) role
    :else "assistant"))

(defn- role-from-kind
  [kind default-role]
  (let [role (normalize-role kind)]
    (if (contains? #{"user" "assistant" "system"} role)
      role
      default-role)))

(defn- payload-text
  [payload]
  (cond
    (string? payload) payload
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
         string/trim)
    :else nil))

(defn- agent-title
  [agent-value]
  (cond
    (string? agent-value) agent-value
    (map? agent-value) (or (:block/title agent-value)
                           (:block/name agent-value))
    :else nil))

(defn- session->messages
  [session block]
  (let [events (:events session)
        base (let [acc (atom {:items {}
                              :order []})]
               (doseq [event events]
                 (let [data (:data event)
                       payload (or (:data data) data)
                       item (:item payload)
                       event-type (:type event)
                       item-kind (:kind item)
                       payload (if (map? payload) payload {})
                       item-id (or (:item_id item)
                                   (:item-id item)
                                   (:itemId item)
                                   (:item_id payload)
                                   (:item-id payload)
                                   (:itemId payload)
                                   (:response_id payload)
                                   (:response-id payload)
                                   (:responseId payload)
                                   (:message_id payload)
                                   (:message-id payload)
                                   (:messageId payload)
                                   (:id payload)
                                   (:event-id event)
                                   (str "event-" (random-uuid)))
                       delta? (and (string? event-type)
                                   (or (= "item.delta" event-type)
                                       (string/includes? event-type ".delta")))
                       delta (when delta?
                               (or (:delta payload)
                                   (:text payload)
                                   (:message payload)
                                   (:output_text payload)
                                   (:raw payload)))
                       role (normalize-role (or (:role item)
                                                (:role payload)
                                                (when (= "audit.log" event-type)
                                                  (role-from-kind (:kind payload) "user"))
                                                (:kind payload)
                                                "assistant"))
                       text-from-item (when (and (= "message" item-kind)
                                                 (seq (:content item)))
                                        (->> (:content item)
                                             (keep (fn [part]
                                                     (when (= "text" (:type part))
                                                       (:text part))))
                                             (apply str)
                                             string/trim))
                       text-from-payload (payload-text payload)
                       message-event? (or (= "message" item-kind)
                                          (= "audit.log" event-type)
                                          (and delta? (string? delta))
                                          (string? text-from-item)
                                          (string? text-from-payload))]
                   (when (and (string? item-id) message-event?)
                     (swap! acc update :items
                            (fn [items]
                              (let [entry (get items item-id {:id item-id
                                                              :role role
                                                              :text ""})]
                                (assoc items item-id
                                       (cond
                                         (and delta? (string? delta))
                                         (update entry :text str delta)

                                         (and (= "item.started" event-type)
                                              (string? role))
                                         (assoc entry :role role)

                                         (and (string? text-from-item)
                                              (not (string/blank? text-from-item)))
                                         (assoc entry :text text-from-item)

                                         (and (string? text-from-payload)
                                              (not (string/blank? text-from-payload)))
                                         (assoc entry :text text-from-payload)

                                         :else entry)))))
                     (swap! acc update :order
                            (fn [order]
                              (if (some #{item-id} order) order (conj order item-id)))))))
               (->> (:order @acc)
                    (map (fn [item-id]
                           (let [{:keys [role text]} (get-in @acc [:items item-id])]
                             (when (and (string? text) (not (string/blank? text)))
                               {:id item-id
                                :role (normalize-role role)
                                :parts [{:type "text" :text text}]}))))
                    (remove nil?)
                    vec))
        task-text (some-> (or (:block/raw-title block) (:block/title block))
                          string/trim)
        user-message (when-not (string/blank? task-text)
                       {:id (str "task-" (:block/uuid block))
                        :role "user"
                        :parts [{:type "text" :text task-text}]})
        has-task? (some (fn [message]
                          (and (= "user" (normalize-role (:role message)))
                               (= task-text (ui-message-text message))))
                        base)]
    (cond
      (and user-message (not has-task?)) (into [user-message] base)
      :else base)))

(defn- message->chat-message
  [message]
  (let [role (normalize-role (:role message))
        text (ui-message-text message)]
    (when (seq text)
      {:id (:id message)
       :role role
       :text text})))

(rum/defc agent-chat-dialog
  [block]
  (let [block-uuid (:block/uuid block)
        [sessions] (hooks/use-atom (:agent/sessions @state/state))
        session (get sessions (str block-uuid))
        session-id (or (:session-id session) (some-> block-uuid str))
        base (db-sync/http-base)
        agent-value (:logseq.property/agent block)
        agent-label (agent-title agent-value)
        messages (session->messages session block)
        status (:status session)
        error (:stream-error session)
        session-started? (boolean (:session-id session))
        chat-messages (->> messages
                           (map message->chat-message)
                           (remove nil?))
        *list-ref (rum/use-ref nil)
        [at-bottom? set-at-bottom!] (rum/use-state true)
        [draft set-draft!] (rum/use-state "")
        trimmed-draft (string/trim (or draft ""))
        scroll-to-bottom! (fn []
                            (when-let [el (rum/deref *list-ref)]
                              (set! (.-scrollTop el) (.-scrollHeight el))))
        handle-scroll! (fn []
                         (when-let [el (rum/deref *list-ref)]
                           (let [distance (- (.-scrollHeight el)
                                             (.-scrollTop el)
                                             (.-clientHeight el))]
                             (set-at-bottom! (<= distance 24)))))
        send-message! (fn []
                        (when (and base session-id (not (string/blank? trimmed-draft)))
                          (set-draft! "")
                          (-> (db-sync/fetch-json (str base "/sessions/" session-id "/messages")
                                                  {:method "POST"
                                                   :headers {"content-type" "application/json"}
                                                   :body (js/JSON.stringify
                                                          (clj->js {:message trimmed-draft
                                                                    :kind "user"}))}
                                                  {:response-schema :sessions/message})
                              (.catch (fn [_] nil)))))]
    (hooks/use-effect!
     (fn []
       (when (agent-handler/task-ready? block)
         (agent-handler/<ensure-session! block))
       nil)
     [block-uuid (:logseq.property/project block) (:logseq.property/agent block)])
    (hooks/use-effect!
     (fn []
       (when (and base session-id session-started?)
         (agent-handler/<fetch-events! block))
       nil)
     [session-id session-started?])
    (hooks/use-effect!
     (fn []
       (js/setTimeout scroll-to-bottom! 0)
       nil)
     [(count chat-messages)])
    [:div.max-w-full.flex.flex-col
     {:style {:height "70vh" :overflow "hidden"}}
     [:div.flex.items-start.justify-between.gap-3
      [:div.flex.flex-col.gap-1
       [:div.text-lg.font-medium (or agent-label "Agent")]
       (when (string? status)
         [:div.text-xs.opacity-60 (string/capitalize status)])
       (when (string? error)
         [:div.text-xs.text-red-500 error])]]
     [:div.mt-4.flex-1.relative.flex.flex-col
      {:style {:minHeight 0}}
      [:div.flex.flex-col.gap-3.overflow-auto.pr-1
       {:ref *list-ref
        :on-scroll handle-scroll!
        :style {:minHeight 0 :flex 1}}
       (if (seq chat-messages)
         (for [{:keys [id role text]} chat-messages
               :let [from-user? (= "user" (normalize-role role))
                     bubble-class (if from-user?
                                    "bg-accent text-accent-foreground"
                                    "bg-secondary text-secondary-foreground")]]
           [:div.flex {:key id :class (if from-user? "justify-end" "justify-start")}
            [:div.rounded-lg.px-3.py-2.text-sm
             {:class bubble-class
              :style {:maxWidth "85%"}}
             [:div.text-xs.opacity-60.mb-1 (if from-user? "You" (or agent-label "Assistant"))]
             [:div.whitespace-pre-wrap text]]])
         [:div.text-sm.opacity-60 "No messages yet."])]
      (when (not at-bottom?)
        [:div.absolute.bottom-3.right-3
         (shui/button
          {:size :xs
           :variant :secondary
           :title "Scroll to bottom"
           :on-click (fn []
                       (scroll-to-bottom!)
                       (set-at-bottom! true))}
          "↓")])]
     [:div.mt-4.flex.gap-2.items-end
      [:textarea.flex-1.rounded-md.border.border-input.bg-transparent.px-3.py-2.text-sm
       {:placeholder "Send a message..."
        :style {:minHeight "88px"}
        :value draft
        :disabled (or (not session-started?) (not (agent-handler/task-ready? block)))
        :on-change (fn [e] (set-draft! (util/evalue e)))
        :on-key-down (fn [e]
                       (when (and (= "Enter" (.-key e))
                                  (or (.-metaKey e) (.-ctrlKey e)))
                         (.preventDefault e)
                         (send-message!)))}]
      (shui/button
       {:size :sm
        :disabled (or (not session-started?)
                      (string/blank? trimmed-draft)
                      (not (agent-handler/task-ready? block)))
        :on-click (fn [] (send-message!))}
       "Send")]]))

(defn open-agent-chat-dialog!
  [block]
  (shui/dialog-open! (fn [] (agent-chat-dialog block)) {:id :agent-chat-dialog}))
