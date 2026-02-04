(ns frontend.components.agent-chat
  (:require [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
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
                       item-id (or (:item_id item)
                                   (:item-id item)
                                   (:itemId item)
                                   (:item_id payload)
                                   (:item-id payload)
                                   (:itemId payload))
                       delta (or (:delta payload)
                                 (get-in payload [:data :delta]))
                       role (normalize-role (or (:role item) "assistant"))
                       message-event? (or (= "message" item-kind)
                                          (= "item.delta" event-type))
                       text-from-content (when (and (= "message" item-kind)
                                                    (seq (:content item)))
                                           (->> (:content item)
                                                (keep (fn [part]
                                                        (when (= "text" (:type part))
                                                          (:text part))))
                                                (apply str)
                                                string/trim))]
                   (when (and (string? item-id) message-event?)
                     (swap! acc update :items
                            (fn [items]
                              (let [entry (get items item-id {:id item-id
                                                              :role role
                                                              :text ""})]
                                (assoc items item-id
                                       (cond
                                         (and (= "item.delta" event-type)
                                              (string? delta))
                                         (update entry :text str delta)

                                         (and (= "item.started" event-type)
                                              (string? role))
                                         (assoc entry :role role)

                                         (and (= "item.completed" event-type)
                                              (string? text-from-content)
                                              (not (string/blank? text-from-content)))
                                         (assoc entry :text text-from-content)

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
        [draft set-draft!] (rum/use-state "")
        trimmed-draft (string/trim (or draft ""))
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
                              (p/catch (fn [_] nil)))))]
    (hooks/use-effect!
     (fn []
       (when (agent-handler/task-ready? block)
         (agent-handler/<ensure-session! block))
       nil)
     [block-uuid (:logseq.property/project block) (:logseq.property/agent block)])
    [:div.max-w-full
     [:div.flex.items-start.justify-between.gap-3
      [:div.flex.flex-col.gap-1
       [:div.text-lg.font-medium (or agent-label "Agent")]
       (when (string? status)
         [:div.text-xs.opacity-60 (string/capitalize status)])
       (when (string? error)
         [:div.text-xs.text-red-500 error])]]
     [:div.mt-4.flex.flex-col.gap-3.overflow-auto.pr-1
      {:style {:maxHeight "60vh"}}
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
