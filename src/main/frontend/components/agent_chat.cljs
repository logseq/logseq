(ns frontend.components.agent-chat
  (:require ["@ai-sdk/react" :refer [useChat]]
            ["@xterm/addon-fit/lib/addon-fit.mjs" :refer [FitAddon]]
            ["@xterm/xterm/css/xterm.css"]
            ["@xterm/xterm/lib/xterm.mjs" :refer [Terminal]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.agent-chat-transport :as chat-transport]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.modules.agent-chat.event :as chat-event]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
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

(defn- chat-role
  [role]
  (let [role (normalize-role role)]
    (if (contains? #{"user" "assistant" "system"} role)
      role
      "assistant")))

(defn- payload-delta
  [payload]
  (or (when (string? (:delta payload)) (:delta payload))
      (when (string? (:text payload)) (:text payload))
      (when (string? (:message payload)) (:message payload))
      (when (string? (:output_text payload)) (:output_text payload))
      (when (string? (:raw payload)) (:raw payload))))

(defn- agent-title
  [agent-value]
  (cond
    (string? agent-value) agent-value
    (map? agent-value) (or (:block/title agent-value)
                           (:block/name agent-value))
    :else nil))

(defn- ^:large-vars/cleanup-todo session->messages
  [session block]
  (let [events (:events session)
        base (let [acc (atom {:items {}
                              :order []
                              :item-kind-by-id {}
                              :tool-call-id-by-item-id {}})]
               (letfn [(known-item-kind [item-id]
                         (get-in @acc [:item-kind-by-id item-id]))
                       (remember-item-kind! [item-id item-kind]
                         (when-let [item-kind (chat-event/normalize-kind item-kind)]
                           (swap! acc assoc-in [:item-kind-by-id item-id] item-kind)))
                       (known-tool-call-id [item-id]
                         (get-in @acc [:tool-call-id-by-item-id item-id]))
                       (remember-tool-call-id! [item-id call-id]
                         (when-let [call-id (some-> call-id str normalized-text)]
                           (swap! acc assoc-in [:tool-call-id-by-item-id item-id] call-id)))
                       (ensure-item! [item-id role]
                         (let [role (chat-role role)]
                           (swap! acc
                                  (fn [state]
                                    (let [has-item? (contains? (:items state) item-id)
                                          state (if has-item?
                                                  state
                                                  (-> state
                                                      (assoc-in [:items item-id] {:id item-id
                                                                                  :role role
                                                                                  :parts []
                                                                                  :part-index {}})
                                                      (update :order (fn [order]
                                                                       (if (some #{item-id} order)
                                                                         order
                                                                         (conj order item-id))))))]
                                      (assoc-in state [:items item-id :role] role))))))
                       (update-part! [item-id part-key default-part f]
                         (let [part-key (vec part-key)]
                           (swap! acc
                                  (fn [state]
                                    (let [entry (or (get-in state [:items item-id])
                                                    {:id item-id
                                                     :role "assistant"
                                                     :parts []
                                                     :part-index {}})
                                          part-index (:part-index entry)
                                          idx (or (get part-index part-key)
                                                  (count (:parts entry)))
                                          entry (if (contains? part-index part-key)
                                                  entry
                                                  (-> entry
                                                      (update :parts conj default-part)
                                                      (assoc-in [:part-index part-key] idx)))
                                          entry (update-in entry [:parts idx] f)]
                                      (assoc-in state [:items item-id] entry))))))
                       (set-text-part! [item-id role text]
                         (when-let [text (normalized-text text)]
                           (ensure-item! item-id role)
                           (update-part! item-id [:text]
                                         {:type "text" :text text}
                                         (fn [part]
                                           (assoc part :type "text" :text text)))))
                       (append-text-part! [item-id role delta]
                         (when (string? delta)
                           (ensure-item! item-id role)
                           (update-part! item-id [:text]
                                         {:type "text" :text ""}
                                         (fn [part]
                                           (assoc part :type "text"
                                                  :text (str (or (:text part) "")
                                                             delta))))))
                       (set-reasoning-part! [item-id role text]
                         (when-let [text (normalized-text text)]
                           (ensure-item! item-id role)
                           (update-part! item-id [:reasoning]
                                         {:type "reasoning" :text text}
                                         (fn [part]
                                           (assoc part :type "reasoning"
                                                  :text text)))))
                       (append-reasoning-part! [item-id role delta]
                         (when (string? delta)
                           (ensure-item! item-id role)
                           (update-part! item-id [:reasoning]
                                         {:type "reasoning" :text ""}
                                         (fn [part]
                                           (assoc part :type "reasoning"
                                                  :text (str (or (:text part) "")
                                                             delta))))))
                       (resolve-tool-call-id [item-id value]
                         (or (some-> (chat-event/tool-call-id value) str normalized-text)
                             (known-tool-call-id item-id)
                             (some-> item-id str normalized-text)))
                       (set-tool-input! [item-id role value]
                         (when-let [call-id (resolve-tool-call-id item-id value)]
                           (let [tool-name (or (chat-event/tool-name value) "tool")
                                 input (or (chat-event/tool-input value) {})]
                             (ensure-item! item-id role)
                             (remember-tool-call-id! item-id call-id)
                             (update-part! item-id [:tool-input call-id]
                                           {:type "tool-input-available"
                                            :toolCallId call-id
                                            :toolName tool-name
                                            :input input}
                                           (fn [part]
                                             (assoc part
                                                    :type "tool-input-available"
                                                    :toolCallId call-id
                                                    :toolName tool-name
                                                    :input input))))))
                       (set-tool-output! [item-id role value]
                         (when-let [call-id (resolve-tool-call-id item-id value)]
                           (let [output (or (chat-event/tool-output value)
                                            (chat-event/payload-text value))]
                             (when (some? output)
                               (ensure-item! item-id role)
                               (remember-tool-call-id! item-id call-id)
                               (update-part! item-id [:tool-output call-id]
                                             {:type "tool-output-available"
                                              :toolCallId call-id
                                              :output output}
                                             (fn [part]
                                               (assoc part
                                                      :type "tool-output-available"
                                                      :toolCallId call-id
                                                      :output output)))))))
                       (append-tool-output-delta! [item-id role value delta]
                         (when (and (string? delta)
                                    (seq delta))
                           (when-let [call-id (resolve-tool-call-id item-id value)]
                             (ensure-item! item-id role)
                             (remember-tool-call-id! item-id call-id)
                             (update-part! item-id [:tool-output call-id]
                                           {:type "tool-output-available"
                                            :toolCallId call-id
                                            :output ""}
                                           (fn [part]
                                             (assoc part
                                                    :type "tool-output-available"
                                                    :toolCallId call-id
                                                    :output (str (if (string? (:output part))
                                                                   (:output part)
                                                                   "")
                                                                 delta)))))))
                       (process-content-part! [item-id role part]
                         (let [part-kind (chat-event/content-part-kind part)]
                           (cond
                             (= "text" part-kind)
                             (set-text-part! item-id role (chat-event/content-part-text part))

                             (= "reasoning" part-kind)
                             (set-reasoning-part! item-id role (chat-event/content-part-text part))

                             (= "tool-call" part-kind)
                             (set-tool-input! item-id role part)

                             (= "tool-result" part-kind)
                             (set-tool-output! item-id role part)

                             (= "status" part-kind)
                             (when-let [error-message (chat-event/status-error-message part)]
                               (set-text-part! item-id "assistant" error-message))

                             :else nil)))
                       (process-event! [event]
                         (let [event-type (:type event)
                               payload (chat-event/unwrap-event-payload event)
                               payload (if (map? payload) payload {})
                               item (if (map? (:item payload)) (:item payload) {})
                               item-id (chat-event/event-item-id event payload item)
                               item-kind (or (chat-event/event-item-kind payload item)
                                             (known-item-kind item-id))
                               role (chat-role (or (:role item)
                                                   (:role payload)
                                                   (when (= "audit.log" event-type)
                                                     (role-from-kind (:kind payload) "user"))
                                                   (:kind payload)
                                                   "assistant"))
                               merged (merge payload item)
                               delta (payload-delta payload)
                               known-tool-call? (string? (known-tool-call-id item-id))
                               tool-result-like? (or (= "tool-result" item-kind)
                                                     known-tool-call?)]
                           (when (string? item-id)
                             (remember-item-kind! item-id item-kind)
                             (case event-type
                               "item.started"
                               (when (= "tool-result" item-kind)
                                 (set-tool-input! item-id role merged))

                               ("item.completed" "response.completed")
                               (if (seq (:content item))
                                 (doseq [part (:content item)]
                                   (process-content-part! item-id role part))
                                 (cond
                                   (= "reasoning" item-kind)
                                   (set-reasoning-part! item-id role (or (chat-event/payload-text item)
                                                                         (chat-event/payload-text payload)))

                                   (= "tool-call" item-kind)
                                   (set-tool-input! item-id role merged)

                                   (= "tool-result" item-kind)
                                   (set-tool-output! item-id role merged)

                                   (= "status" item-kind)
                                   (when-let [error-message (chat-event/status-error-message merged)]
                                     (set-text-part! item-id "assistant" error-message))

                                   :else
                                   (set-text-part! item-id role (or (chat-event/payload-text item)
                                                                    (chat-event/payload-text payload)))))

                               "audit.log"
                               (set-text-part! item-id "user" (chat-event/payload-text payload))

                               nil)

                             (when (chat-event/delta-event? event-type)
                               (cond
                                 (= "reasoning" item-kind)
                                 (append-reasoning-part! item-id role delta)

                                 (= "tool-call" item-kind)
                                 (set-tool-input! item-id role merged)

                                 tool-result-like?
                                 (append-tool-output-delta! item-id role merged delta)

                                 :else
                                 (append-text-part! item-id role delta))))))]
                 (doseq [event events]
                   (process-event! event))
                 (->> (:order @acc)
                      (keep (fn [item-id]
                              (let [entry (get-in @acc [:items item-id])
                                    parts (vec (keep normalize-message-part (:parts entry)))
                                    role (chat-role (:role entry))]
                                (when (seq parts)
                                  {:id item-id
                                   :role role
                                   :parts parts}))))
                      vec)))
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

(defn- message-size
  [message]
  (count (pr-str (select-keys message [:id :role :parts]))))

(def ^:private commit-message-max-len 120)

(defn- latest-assistant-summary
  [messages]
  (some->> messages
           reverse
           (keep (fn [message]
                   (when (= "assistant" (normalize-role (:role message)))
                     (ui-message-text message))))
           first
           normalized-text))

(defn- summary->commit-message
  [summary]
  (when-let [summary (normalized-text summary)]
    (let [single-line (string/replace summary #"\s+" " ")]
      (subs single-line 0 (min commit-message-max-len (count single-line))))))

(defn- session-messages-need-sync?
  [session-messages ui-messages]
  (let [ui-by-id (into {} (map (juxt :id identity) ui-messages))]
    (boolean
     (or (and (seq session-messages)
              (empty? ui-messages))
         (> (count session-messages) (count ui-messages))
         (some (fn [session-message]
                 (if-let [ui-message (get ui-by-id (:id session-message))]
                   (and (not= session-message ui-message)
                        (>= (message-size session-message)
                            (message-size ui-message)))
                   true))
               session-messages)))))

(defn- parse-json-safe
  [value]
  (when (string? value)
    (try
      (js->clj (js/JSON.parse value) :keywordize-keys true)
      (catch :default _ nil))))

(defn- websocket-open?
  [^js socket]
  (and socket (= (.-readyState socket) js/WebSocket.OPEN)))

(defn- terminal-status-label
  [status]
  (case status
    :connecting "Connecting"
    :connected "Connected"
    :disconnected "Disconnected"
    :failed "Failed"
    :idle "Idle"
    "Idle"))

(defn- terminal-control-bytes
  [payload]
  (.encode (js/TextEncoder.)
           (str "\u0000" (js/JSON.stringify (clj->js payload)))))

(defn- send-terminal-resize!
  [^js socket ^js terminal]
  (when (and (websocket-open? socket) terminal)
    (.send socket
           (terminal-control-bytes {:type "resize"
                                    :cols (.-cols terminal)
                                    :rows (.-rows terminal)}))))

(rum/defc ^:large-vars/cleanup-todo agent-chat-dialog
  [block]
  (let [block-uuid (:block/uuid block)
        [sessions] (hooks/use-atom (:agent/sessions @state/state))
        session (get sessions (str block-uuid))
        session-id (or (:session-id session) (some-> block-uuid str))
        base (db-sync/http-base)
        agent-value (:logseq.property/agent block)
        agent-label (agent-title agent-value)
        session-messages (session->messages session block)
        transport (hooks/use-memo
                   #(chat-transport/make-transport {:base base
                                                    :session-id session-id
                                                    :open-stream? false})
                   [base session-id])
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
        error (or chat-error (:stream-error session))
        session-started? (boolean (:session-id session))
        terminal-enabled? (agent-handler/session-terminal-enabled? session)
        session-chat-messages (->> session-messages
                                   (map message->chat-message)
                                   (remove nil?))
        chat-messages (->> ui-messages
                           (map message->chat-message)
                           (remove nil?))
        [draft set-draft!] (rum/use-state "")
        [publish-mode set-publish-mode!] (rum/use-state nil)
        [terminal-visible? set-terminal-visible!] (rum/use-state false)
        [terminal-status set-terminal-status!] (rum/use-state :idle)
        [terminal-error set-terminal-error!] (rum/use-state nil)
        [terminal-connection-key set-terminal-connection-key!] (rum/use-state 0)
        terminal-container-ref (hooks/use-ref nil)
        auth-token (state/get-auth-id-token)
        terminal-url (agent-handler/terminal-websocket-url base
                                                           session-id
                                                           {:token auth-token})
        terminal-open-disabled? (or (not session-started?)
                                    (not (string? terminal-url)))
        trimmed-draft (string/trim (or draft ""))
        busy? (contains? #{"submitted" "streaming"} chat-status)
        input-disabled? (or (not session-started?) (not (agent-handler/task-ready? block)))
        publish-busy? (some? publish-mode)
        publish-disabled? (or input-disabled? busy? publish-busy?)
        can-send? (and (not input-disabled?)
                       (not (string/blank? trimmed-draft))
                       (not busy?))
        send-message! (fn []
                        (when (and can-send? base session-id)
                          (set-draft! "")
                          (-> (.sendMessage chat #js {:text trimmed-draft})
                              (.catch (fn [_] nil)))))
        publish! (fn [create-pr?]
                   (when (and base session-id (not publish-disabled?))
                     (set-publish-mode! (if create-pr? :pr :push))
                     (let [summary (latest-assistant-summary session-chat-messages)
                           commit-message (summary->commit-message summary)
                           opts (cond-> {:create-pr? create-pr?}
                                  (string? summary) (assoc :body summary)
                                  (string? commit-message) (assoc :commit-message commit-message))]
                       (-> (agent-handler/<publish-session! block opts)
                           (p/catch (fn [_] nil))
                           (p/finally (fn [] (set-publish-mode! nil)))))))
        open-terminal! (fn []
                         (when (and terminal-enabled? (not terminal-open-disabled?))
                           (set-terminal-visible! true)
                           (set-terminal-status! :connecting)
                           (set-terminal-error! nil)
                           (set-terminal-connection-key! (inc terminal-connection-key))))
        reconnect-terminal! (fn []
                              (when terminal-enabled?
                                (set-terminal-status! :connecting)
                                (set-terminal-error! nil)
                                (set-terminal-connection-key! (inc terminal-connection-key))))
        close-terminal! (fn []
                          (set-terminal-visible! false)
                          (set-terminal-status! :disconnected))]
    (hooks/use-effect!
     (fn []
       (when (agent-handler/task-ready? block)
         (agent-handler/<ensure-session! block))
       nil)
     [block-uuid (:logseq.property/project block) (:logseq.property/agent block)])
    (hooks/use-effect!
     (fn []
       (when (and (fn? set-messages!)
                  (session-messages-need-sync? session-chat-messages chat-messages))
         (set-messages! (clj->js session-chat-messages)))
       nil)
     [session-id (pr-str session-chat-messages) (pr-str chat-messages)])
    (hooks/use-effect!
     (fn []
       (when (and base session-id session-started?)
         (agent-handler/<fetch-events! block))
       nil)
     [session-id session-started?])
    (hooks/use-effect!
     (fn []
       (if (and terminal-visible?
                terminal-enabled?
                (string? terminal-url))
         (if-let [container (hooks/deref terminal-container-ref)]
           (let [terminal (Terminal. #js {:convertEol true
                                          :cursorBlink true
                                          :fontSize 12
                                          :fontFamily "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"})
                 fit-addon (FitAddon.)
                 socket (js/WebSocket. terminal-url)
                 encoder (js/TextEncoder.)
                 handle-window-resize (fn []
                                        (try
                                          (.fit fit-addon)
                                          (catch :default _ nil))
                                        (send-terminal-resize! socket terminal))
                 handle-open (fn []
                               (set-terminal-status! :connected)
                               (try
                                 (.fit fit-addon)
                                 (catch :default _ nil))
                               (send-terminal-resize! socket terminal))
                 handle-message (fn [event]
                                  (let [payload (.-data event)]
                                    (cond
                                      (string? payload)
                                      (when-let [message (parse-json-safe payload)]
                                        (case (:type message)
                                          "ready"
                                          (do
                                            (set-terminal-status! :connected)
                                            (send-terminal-resize! socket terminal))

                                          "error"
                                          (do
                                            (set-terminal-status! :failed)
                                            (set-terminal-error! (or (:message message)
                                                                     "terminal connection error")))

                                          "exit"
                                          (set-terminal-status! :disconnected)

                                          nil))

                                      (instance? js/ArrayBuffer payload)
                                      (.write terminal (js/Uint8Array. payload))

                                      (instance? js/Blob payload)
                                      (-> (.arrayBuffer payload)
                                          (.then (fn [buffer]
                                                   (.write terminal (js/Uint8Array. buffer))))
                                          (.catch (fn [_] nil)))

                                      :else nil)))
                 handle-error (fn []
                                (set-terminal-status! :failed)
                                (set-terminal-error! "terminal websocket error"))
                 handle-close (fn []
                                (set-terminal-status! :disconnected))]
             (set! (.-innerHTML container) "")
             (.loadAddon terminal fit-addon)
             (.open terminal container)
             (try
               (.fit fit-addon)
               (catch :default _ nil))
             (.focus terminal)
             (set! (.-binaryType socket) "arraybuffer")
             (let [dispose-data (.onData terminal
                                         (fn [payload]
                                           (when (websocket-open? socket)
                                             (.send socket (.encode encoder payload)))))]
               (.addEventListener socket "open" handle-open)
               (.addEventListener socket "message" handle-message)
               (.addEventListener socket "error" handle-error)
               (.addEventListener socket "close" handle-close)
               (.addEventListener js/window "resize" handle-window-resize)
               (js/setTimeout
                (fn []
                  (try
                    (.fit fit-addon)
                    (catch :default _ nil))
                  (send-terminal-resize! socket terminal))
                50)
               (fn []
                 (.removeEventListener socket "open" handle-open)
                 (.removeEventListener socket "message" handle-message)
                 (.removeEventListener socket "error" handle-error)
                 (.removeEventListener socket "close" handle-close)
                 (.removeEventListener js/window "resize" handle-window-resize)
                 (when dispose-data
                   (.dispose dispose-data))
                 (when (or (= (.-readyState socket) js/WebSocket.CONNECTING)
                           (websocket-open? socket))
                   (.close socket 1000 "client-close"))
                 (try
                   (.dispose terminal)
                   (catch :default _ nil)))))
           nil)
         nil))
     [terminal-visible?
      terminal-enabled?
      terminal-url
      terminal-connection-key])
    [:div.max-w-full.flex.flex-col
     {:style {:height "70vh" :overflow "hidden"}}
     [:div.flex.items-start.justify-between.gap-3
      [:div.flex.flex-col.gap-1
       [:div.flex.items-center.gap-2.text-xs.opacity-75
        (or agent-label "Agent")
        (when busy?
          [:div.inline-flex.items-center.gap-1
           [:span.inline-block.h-1.5.w-1.5.animate-pulse.rounded-full.bg-emerald-500]
           "Streaming"])]
       (when (string? error)
         [:div.text-xs.text-red-500 error])
       (when (string? terminal-error)
         [:div.text-xs.text-red-500 terminal-error])]
      (when terminal-enabled?
        [:div.flex.items-center.gap-2
         (shui/button
          {:size :sm
           :variant :outline
           :class "h-7 px-2 text-xs"
           :disabled terminal-open-disabled?
           :on-click (fn [_]
                       (if terminal-visible?
                         (reconnect-terminal!)
                         (open-terminal!)))}
          (if terminal-visible?
            "Reconnect terminal"
            "Open terminal"))
         (when terminal-visible?
           (shui/button
            {:size :sm
             :variant :outline
             :class "h-7 px-2 text-xs"
             :on-click (fn [_] (close-terminal!))}
            "Close"))])]
     [:div.mt-4.relative.flex.flex-1.flex-col.overflow-hidden.rounded-xl.border.border-border.bg-gradient-to-b.from-background.to-muted
      {:style {:minHeight 0}}
      (shui/agent-chat-box
       {:messages (bean/->js chat-messages)
        :agent-label agent-label
        :class "h-full"
        :content-class-name "gap-3 px-2 py-2 sm:px-3"})]
     (when terminal-visible?
       [:div.mt-3.rounded-xl.border.border-border.overflow-hidden
        [:div.flex.items-center.justify-between.px-3.py-2.bg-muted
         [:div.text-xs.opacity-80
          (str "Terminal · " (terminal-status-label terminal-status))]
         (when terminal-open-disabled?
           [:div.text-xs.opacity-60 "Start session to connect"])]
        [:div
         {:ref terminal-container-ref
          :class "h-56 w-full bg-black"}]])
     [:div.mt-3.flex.items-center.justify-between.gap-2
      [:div.text-xs.opacity-60
       (if publish-busy?
         "Publishing changes..."
         "Publish session changes")]
      [:div.flex.items-center.gap-2
       (shui/button
        {:size :sm
         :variant :outline
         :class "h-7 px-2 text-xs"
         :disabled publish-disabled?
         :on-click (fn [_]
                     (publish! false))}
        (if (= publish-mode :push)
          "Pushing..."
          "Push"))
       (shui/button
        {:size :sm
         :class "h-7 px-2 text-xs"
         :disabled publish-disabled?
         :on-click (fn [_]
                     (publish! true))}
        (if (= publish-mode :pr)
          "Creating PR..."
          "Push + PR"))]]
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
