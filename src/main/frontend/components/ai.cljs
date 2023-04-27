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
            [clojure.string :as string]))

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
                        (when (= (gobj/get e "key") "Enter")
                          (ai-handler/ask! q {:conversation-id (:chat/current-conversation @state/state)})
                          (state/set-state! [:ui/chat :q] "")))}]]))

(rum/defc conversation
  [conversation-id]
  [:div.conversation
   [:div.messages
    (let [messages (db-model/get-chat-conversation conversation-id)]
      (for [message-id messages]
        (let [block (db/entity message-id)]
          [:div.message {:class (get-in block [:block/properties :logseq.ai.type])}
           (:block/content block)])))]])

(rum/defc conversations
  []
  [:div.conversations
   (ui/button "New conversation")
   (let [conversations (db-model/get-chat-conversations)]
     (for [c conversations]
       [:div.conversation-item
        [:a {:on-click (state/set-state! :chat/current-conversation (:db/id c))}
         (string/replace-first (:block/original-name c) "Chat/" "")]]))])

(rum/defc chat < rum/reactive
  []
  (let [conversation-id (state/sub :chat/current-conversation)]
    [:div.chat
     (conversations)
     [:div.flex.flex-1.relative
      (conversation conversation-id)
      (input)]]))
