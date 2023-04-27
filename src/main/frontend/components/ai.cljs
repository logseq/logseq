(ns frontend.components.ai
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.handler.ai :as ai-handler]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [clojure.string :as string]
            [frontend.util.property :as property]))

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
                        (when (and (= (gobj/get e "key") "Enter")
                                   (not (string/blank? q)))
                          (swap! *messages conj
                                 {:block/properties {:logseq.ai.type "question"}
                                  :block/content q})
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
                                           (reset! *messages []))})
                          (state/set-state! [:ui/chat :q] "")))}]]))

(rum/defc conversation-message < rum/static
  [block]
  [:div.message {:class (get-in block [:block/properties :logseq.ai.type])}
   (property/remove-properties :markdown (:block/content block))])

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
  []
  [:div.conversations
   (ui/button "New conversation"
     :on-click (fn [] (ai-handler/new-conversation! nil)))
   (let [conversations (db-model/get-chat-conversations)]
     (for [c conversations]
       [:div.conversation-item
        [:a {:on-click #(state/set-state! :chat/current-conversation (:db/id c))}
         (string/replace-first (:block/original-name c) "Chat/" "")]]))])

(rum/defc chat < rum/reactive
  []
  (let [conversation-id (state/sub :chat/current-conversation)]
    [:div.chat
     (conversations)
     [:div.flex.flex-1.relative
      (conversation conversation-id)
      (input)]]))
