(ns frontend.components.agent-chat
  (:require ["@ai-sdk/react" :refer [useChat Chat]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.agent-chat-transport :as chat-transport]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.property :as property-handler]
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

(def ^:private model-options
  [{:id "Codex" :label "Codex"}
   {:id "Claude Code" :label "Claude Code"}])

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

(defn- message-bubble
  [message]
  (let [role (normalize-role (:role message))
        mine? (= "user" role)
        role-label (if mine? "You" "Assistant")
        bubble-classes (if mine?
                         "bg-primary text-primary-foreground rounded-br-sm"
                         "bg-muted/70 text-foreground rounded-bl-sm")
        row-classes (if mine? "justify-end" "justify-start")
        text (ui-message-text message)]
    (when (seq text)
      [:div.flex.flex-row.items-end.gap-2 {:class row-classes}
       [:div.flex.flex-col.gap-1 {:class (str (if mine? "items-end" "items-start")
                                              " max-w-[85%]")}
        [:div {:class "text-[11px] uppercase tracking-wider opacity-60"} role-label]
        [:div.rounded-2xl.px-4.py-2.shadow-sm {:class bubble-classes}
         [:div.whitespace-pre-wrap.leading-relaxed.text-sm text]]]])))

(defn- model-pill
  [{:keys [id label]} selected on-click]
  (let [active? (= id selected)]
    [:button
     {:key id
      :class (str "h-8 rounded-full border px-3 text-xs font-medium transition "
                  (if active?
                    "border-primary bg-primary text-primary-foreground shadow-sm"
                    "border-muted bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"))
      :type "button"
      :on-click #(on-click id)}
     label]))

(rum/defc agent-chat-dialog
  [block]
  (let [block-uuid (:block/uuid block)
        [sessions] (hooks/use-atom (:agent/sessions @state/state))
        session (get sessions (str block-uuid))
        session-id (or (:session-id session) (some-> block-uuid str))
        base (db-sync/http-base)
        agent-value (:logseq.property/agent block)
        agent-label (agent-title agent-value)
        initial-messages (session->messages session block)
        known-ids (mapv :id initial-messages)
        [transport] (rum/use-state
                     (fn []
                       (chat-transport/make-transport {:base base
                                                       :session-id session-id
                                                       :known-ids known-ids})))
        [chat-instance] (rum/use-state
                         (fn []
                           (new Chat (bean/->js {:id session-id
                                                 :messages initial-messages
                                                 :transport transport}))))
        chat (useChat (bean/->js {:chat chat-instance
                                  :resume true}))
        messages (js->clj (.-messages chat) :keywordize-keys true)
        status (.-status chat)
        error (.-error chat)
        set-messages (.-setMessages chat)
        stop-chat (.-stop chat)
        [input set-input!] (rum/use-state "")]
    (hooks/use-effect!
     (fn []
       (when (agent-handler/task-ready? block)
         (agent-handler/<ensure-session! block))
       nil)
     [block-uuid (:logseq.property/project block) (:logseq.property/agent block)])
    (hooks/use-effect!
     (fn []
       (when (and (fn? set-messages) (seq initial-messages))
         (set-messages (bean/->js initial-messages)))
       nil)
     [session-id (count initial-messages)])
    [:div.max-w-full
     {:class "w-[min(860px,92vw)]"}
     [:div {:class "flex h-[72vh] flex-col overflow-hidden rounded-3xl border border-muted/60 bg-background shadow-xl"}
      [:div {:class "flex items-center justify-between border-b border-muted/60 px-5 py-3"}
       [:div {:class "flex items-center gap-3"}
        [:div {:class "flex flex-col"}
         [:div {:class "text-base font-medium opacity-70"} agent-label]]]
       [:div {:class "flex items-center gap-2"}
        (when (string? status)
          [:div {:class "rounded-full border border-muted/60 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground"}
           (string/capitalize status)])
        (when (and (agent-handler/task-ready? block)
                   (not (:session-id session)))
          (shui/button
           {:variant :default
            :size :sm
            :on-click (fn [e]
                        (util/stop e)
                        (-> (agent-handler/<start-session! block)
                            (p/catch (fn [_] nil))))}
           "Start session"))]]

      [:div {:class "flex-1 overflow-auto space-y-4 px-5 py-4"}
       (if (seq messages)
         (for [message messages]
           (message-bubble message))
         [:div {:class "flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground"}
          [:div {:class "mb-2 text-base font-medium text-foreground"} "No messages yet"]
          [:div "Ask the agent to start exploring this project."]])]

      (when error
        [:div {:class "px-5 pb-2 text-xs text-red-600"} (str "Error: " error)])

      [:div
       {:class "border-t border-muted/60 bg-background px-5 py-3"}
       [:form
        {:class "flex items-end gap-2"
         :on-submit (fn [e]
                      (util/stop e)
                      (when (seq (string/trim input))
                        (-> (.sendMessage chat #js {:text input})
                            (p/catch (fn [_] nil)))
                        (set-input! "")))}
        [:div {:class "flex-1"}
         [:textarea
          {:class "form-input block w-full resize-none text-sm leading-relaxed"
           :placeholder "Send a message..."
           :rows 1
           :value input
           :on-change #(set-input! (.. % -target -value))}]]
        (when (and (= "streaming" status) (fn? stop-chat))
          (shui/button
           {:variant :outline
            :size :sm
            :type "button"
            :on-click (fn [e]
                        (util/stop e)
                        (stop-chat))}
           "Stop"))
        (shui/button
         {:variant :default
          :size :sm
          :disabled (or (string/blank? (string/trim input))
                        (= "streaming" status))}
         "Send")]]]]))

(defn open-agent-chat-dialog!
  [block]
  (shui/dialog-open! (fn [] (agent-chat-dialog block)) {:id :agent-chat-dialog}))
