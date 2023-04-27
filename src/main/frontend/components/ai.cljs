(ns frontend.components.ai
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.util :as util]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [frontend.handler.ai :as ai-handler]))

(rum/defc input < rum/reactive
  []
  (let [q (state/sub [:ui/chat :q])
        on-change-fn (fn [e]
                       (let [value (util/evalue e)
                             e-type (gobj/getValueByKeys e "type")]
                         (state/set-state! [:ui/chat :q] value)))]
    [:div.flex.w-full.relative
     [:input.form-input.block.sm:text-sm.sm:leading-5.my-2.border-none.outline-none.shadow-none.focus:shadow-none
      {:auto-focus true
       :placeholder "What do you want to know?"
       :aria-label "What do you want to know?"
       :value q
       :on-change on-change-fn
       :on-key-down   (fn [^js e]
                        (when (= (gobj/get e "key") "Enter")
                          (ai-handler/ask! q {})))}]]))

(rum/defc conversation
  [page-id]
  [:div.conversation
   ])

(rum/defc chat
  []
  (let [page-id 1]
    [:div.chat
     [:div.conversations]
     [:div
      (conversation page-id)
      (input)]]))
