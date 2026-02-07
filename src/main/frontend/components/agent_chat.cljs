(ns frontend.components.agent-chat
  (:require ["@ai-sdk/react" :refer [useChat]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.agent-chat-transport :as chat-transport]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- normalized-text
  [value]
  (when (string? value)
    (let [value (string/trim value)]
      (when-not (string/blank? value)
        value))))

(defn- text-from-content-parts
  [parts]
  (when (seq parts)
    (some->> parts
             (keep (fn [part]
                     (when (= "text" (:type part))
                       (or (:text part) (:content part)))))
             (apply str)
             normalized-text)))

(defn- normalize-message-part
  [part]
  (when (map? part)
    (if (= "text" (:type part))
      (when-let [text (normalized-text (or (:text part) (:content part)))]
        {:type "text"
         :text text})
      part)))

(defn- ui-message-text
  [message]
  (or (text-from-content-parts (:parts message))
      (let [content (:content message)]
        (cond
          (string? content)
          (normalized-text content)

          (seq content)
          (text-from-content-parts content)

          :else nil))
      (normalized-text (:text message))))

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
        parts (vec (keep normalize-message-part (:parts message)))
        fallback-text (ui-message-text message)
        resolved-parts (cond
                         (seq parts) parts
                         (string? fallback-text) [{:type "text" :text fallback-text}]
                         :else [])]
    (when (seq resolved-parts)
      {:id (or (:id message) (str "message-" (random-uuid)))
       :role role
       :parts resolved-parts})))

(rum/defc agent-chat-dialog
  [block]
  (let [block-uuid (:block/uuid block)
        [sessions] (hooks/use-atom (:agent/sessions @state/state))
        session (get sessions (str block-uuid))
        session-id (or (:session-id session) (some-> block-uuid str))
        base (db-sync/http-base)
        agent-value (:logseq.property/agent block)
        agent-label (agent-title agent-value)
        session-messages (session->messages session block)
        [transport] (rum/use-state
                     (fn []
                       (chat-transport/make-transport {:base base
                                                       :session-id session-id})))
        chat (useChat #js {:id session-id
                           :transport transport
                           :messages (clj->js session-messages)})
        set-messages! (.-setMessages chat)
        ui-messages (js->clj (.-messages chat) :keywordize-keys true)
        chat-status (some-> (.-status chat) str)
        chat-error (let [e (.-error chat)]
                     (when e
                       (or (.-message e)
                           (str e))))
        status (or chat-status (:status session))
        error (or chat-error (:stream-error session))
        session-started? (boolean (:session-id session))
        chat-messages (->> ui-messages
                           (map message->chat-message)
                           (remove nil?))
        [draft set-draft!] (rum/use-state "")
        trimmed-draft (string/trim (or draft ""))
        busy? (contains? #{"submitted" "streaming"} chat-status)
        input-disabled? (or (not session-started?) (not (agent-handler/task-ready? block)))
        can-send? (and (not input-disabled?)
                       (not (string/blank? trimmed-draft))
                       (not busy?))
        send-message! (fn []
                        (when (and can-send? base session-id)
                          (set-draft! "")
                          (-> (.sendMessage chat #js {:text trimmed-draft})
                              (.catch (fn [_] nil)))))]
    (hooks/use-effect!
     (fn []
       (when (agent-handler/task-ready? block)
         (agent-handler/<ensure-session! block))
       nil)
     [block-uuid (:logseq.property/project block) (:logseq.property/agent block)])
    (hooks/use-effect!
     (fn []
       (when (and (fn? set-messages!)
                  (seq session-messages)
                  (> (count session-messages) (count ui-messages)))
         (set-messages! (clj->js session-messages)))
       nil)
     [session-id (count session-messages)])
    (hooks/use-effect!
     (fn []
       (when (and base session-id session-started?)
         (agent-handler/<fetch-events! block))
       nil)
     [session-id session-started?])
    [:div.max-w-full.flex.flex-col
     {:style {:height "70vh" :overflow "hidden"}}
     [:div.flex.items-start.justify-between.gap-3
      [:div.flex.flex-col.gap-1
       [:div.text-lg.font-medium (or agent-label "Agent")]
       [:div.flex.items-center.gap-2.text-xs.opacity-75
        (when (string? status)
          [:div.rounded-md.bg-muted.px-2.py-0.5.font-medium
           (string/capitalize status)])
        (when busy?
          [:div.inline-flex.items-center.gap-1
           [:span.inline-block.h-1.5.w-1.5.animate-pulse.rounded-full.bg-emerald-500]
           "Streaming"])]
       (when (string? error)
         [:div.text-xs.text-red-500 error])]]
     [:div.mt-4.relative.flex.flex-1.flex-col.overflow-hidden.rounded-xl.border.border-border.bg-gradient-to-b.from-background.to-muted
      {:style {:minHeight 0}}
      (shui/agent-chat-box
       {:messages (bean/->js chat-messages)
        :agent-label agent-label
        :class "h-full"
        :content-class-name "gap-3 px-2 py-2 sm:px-3"})]
     (shui/agent-chat-prompt-input
      {:value draft
       :on-value-change set-draft!
       :on-send send-message!
       :disabled input-disabled?
       :busy busy?
       :placeholder (if input-disabled?
                      "Start the session to chat..."
                      "Message the agent...")
       :hint "Enter to send, Shift+Enter for newline"})]))

(defn open-agent-chat-dialog!
  [block]
  (shui/dialog-open! (fn [] (agent-chat-dialog block)) {:id :agent-chat-dialog}))
