(ns frontend.components.ai
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.handler.ai :as ai-handler]
            [frontend.handler.route :as route-handler]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [clojure.string :as string]
            [frontend.util.property :as property]
            [cljs-time.coerce :as tc]
            [frontend.components.block :as block]
            [frontend.components.select :as select]
            [frontend.modules.ai.prompts :as prompts]
            [promesa.core :as p]))

(defonce *messages (atom []))

(defn- scroll-to-bottom
  []
  (when-let [node (gdom/getElement "conversation")]
    (util/scroll-to-bottom node)))

(rum/defc input < rum/reactive
  []
  (let [q (state/sub [:ui/chat :q])
        on-change-fn (fn [e]
                       (let [value (util/evalue e)
                             e-type (gobj/getValueByKeys e "type")]
                         (state/set-state! [:ui/chat :q] value)))]
    [:div.input-box
     [:input.form-input
      {:auto-focus true
       :placeholder "Write a message"
       :aria-label "Write a message"
       :value q
       :on-change on-change-fn
       :on-key-down   (fn [^js e]
                        (let [drawing? (string/starts-with? q "/draw ")]
                          (when (and (= (gobj/get e "key") "Enter")
                                    (not (string/blank? q)))
                           (swap! *messages conj
                                  {:block/properties {:logseq.ai.type "question"}
                                   :block/content q})
                           (when drawing?
                             (swap! *messages conj
                                    {:block/properties {:logseq.ai.type "answer"}
                                     :block/content "Loading ..."}))
                           (scroll-to-bottom)
                           (ai-handler/chat!
                            q
                            {:conversation-id (:chat/current-conversation @state/state)
                             :on-message (fn [message]
                                           (let [last-message (peek @*messages)
                                                 answer? (= "answer" (get-in last-message [:block/properties :logseq.ai.type]))]
                                             (reset! *messages (conj (if answer? (pop @*messages) @*messages)
                                                                     {:block/properties {:logseq.ai.type "answer"}
                                                                      :block/content message}))
                                             (scroll-to-bottom)))
                             :on-finished (fn []
                                            (reset! *messages [])
                                            (scroll-to-bottom))})
                           (state/set-state! [:ui/chat :q] ""))))}]]))

(rum/defc conversation-message < rum/static
  [block]
  [:div.message {:class (get-in block [:block/properties :logseq.ai.type])}
   (if (:db/id block)
     (block/single-block-cp (:block/uuid block))
     (property/remove-properties :markdown (:block/content block)))])

(rum/defcs conversation < rum/reactive
  [state conversation-id]
  [:div#conversation
   [:div.messages
    (let [messages (concat (db-model/get-chat-conversation conversation-id) (rum/react *messages))]
      (for [message messages]
        (let [block (if (integer? message)
                      (db/entity message)
                      message)]
          (conversation-message block))))]])

(rum/defc conversations
  [conversation-id]
  [:div.conversations
   (ui/button "New conversation"
     :icon "plus"
     :intent "border-link"
     :small? true
     :on-click (fn [] (ai-handler/new-conversation! nil nil)))
   (let [conversations (db-model/get-chat-conversations)]
     (for [c conversations]
       (let [current? (= conversation-id (:db/id c))]
         [:div.conversation-item
          [:a {:title (str (:block/original-name c) " - "
                           (tc/to-date (:block/created-at c)))
               :on-click #(state/set-state! :chat/current-conversation (:db/id c))}
           (str (when current? "-> ") (string/replace-first (:block/original-name c) "Chat/" ""))]])))])

(rum/defc chat < rum/reactive
  []
  (let [conversation-id (state/sub :chat/current-conversation)]
    [:div.chat
     (conversations conversation-id)
     [:div.flex.flex-1.relative
      (conversation conversation-id)
      (input)]]))

(rum/defc chat-main
  []
  [:div.mt-8.p-4#chat-main
   [:div.flex.flex-row.items-center
    [:h1.title "Chat"
     (ui/button
       (ui/icon "arrow-move-right")
       :title "Open chat in right sidebar"
       :on-click (fn []
                   (state/sidebar-add-block! (state/get-current-repo) "chat" :chat)
                   (route-handler/redirect! {:to :home}))
       :small? true
       :intent "link")]]
   (chat)])

(defn- selected-blocks->content
  [blocks]
  (let [down? (= (:selectin/direction @state/state) :down)]
    (->> (if down? blocks (reverse blocks))
         (map #(:block/content (db/entity [:block/uuid %])))
         (remove string/blank?)
         (string/join "\n"))))

(defn- send-request
  [state]
  (let [[prompt content] (:rum/args state)
        content' (str (:prompt prompt) "\n" content)]
    (reset! (::loading? state) true)
    (->
     (p/let [result (ai-handler/generate-text content' {})]
       (reset! (::result state) result)
       (reset! (::loading? state) false))
     (p/catch (fn [error]
                (js/console.error error)
                (reset! (::error state) error))))))

(rum/defcs ai-prompt-body < rum/static
  (rum/local nil ::result)
  (rum/local false ::loading?)
  (rum/local nil ::error)
  {:will-mount (fn [state]
                 (send-request state)
                 state)}
  [state prompt content]
  (let [*result (::result state)
        *loading? (::loading? state)
        *error (::error state)]
    [:div
     [:div.whitespace-pre-wrap.my-2
      content]
     (when @*loading?
       (ui/loading "Loading ..."))
     (if @*error
       [:div.warning (str @*error)]
       (when @*result
        [:div.result.whitespace-pre-wrap.my-2
         @*result]))
     [:div.flex.flex-row.justify-between.my-2
      (ui/button "Regenerate" :on-click (fn [] (send-request state)))
      [:div.flex.flex-row.justify-between
       (ui/button "Replace"
         :on-click (fn [])
         :class "mr-2")
       (ui/button "Insert"
         :on-click (fn []))]]]))

(rum/defcs ai-modal <
  (rum/local nil ::prompt)
  [state]
  (let [*prompt (::prompt state)
        items @prompts/prompts
        editing-block (state/get-edit-block)
        selected-blocks (state/get-selection-block-ids)
        content (if editing-block
                  (some-> (state/get-input) (.-value))
                  (selected-blocks->content selected-blocks))]
    [:div.ask-ai
     (cond
       (and @*prompt (or editing-block selected-blocks))
       [:div.prompt
        [:div.font-medium.text-lg.mb-4 (:description @*prompt)]
        (ai-prompt-body @*prompt content)]

       :else
       (select/select {:items items
                      :item-cp (fn [result chosen?]
                                 (:name result))
                      :on-chosen (fn [chosen]
                                   (reset! *prompt chosen))
                      :extract-fn :name
                      :close-modal? false
                      :input-default-placeholder "Ask AI"}))]))
