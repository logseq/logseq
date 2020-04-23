(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]
            [dommy.core :as d]
            [goog.object :as gobj]
            [goog.dom :as gdom]))

(rum/defc box <
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      nil
      :show-fn (fn []
                 (:edit? @state/state))
      :on-hide (fn []
                 (let [[_ {:keys [on-hide dummy?]} id] (:rum/args state)
                       node (gdom/getElement id)
                       value (gobj/get node "value")]
                   (on-hide value))))))
  {:will-mount (fn [state]
                 (when-let [content (first (:rum/args state))]
                   (handler/set-edit-content! content))
                 state)
   :did-mount (fn [state]
                (let [[content opts id] (:rum/args state)]
                  (handler/restore-cursor-pos! id content (:dummy? opts)))
                state)}
  [content {:keys [on-hide dummy?]
            :or {dummy? false}} id]
  (ui/textarea
   {:id id
    :on-change (fn [e]
                 (handler/set-edit-content! (util/evalue e)))
    :initial-value content
    :value-atom state/edit-content
    :dummy? dummy?
    :auto-focus true
    :style {:border "none"
            :border-radius 0
            :background "transparent"
            :padding 0}
    :on-key-down #(handler/reset-cursor-pos! id)
    :on-click #(handler/reset-cursor-pos! id)}))
