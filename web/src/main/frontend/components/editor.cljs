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
            [goog.dom :as gdom]
            [clojure.string :as string]))

(rum/defc box < rum/reactive
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
  {:init (fn [state _props]
           (let [[content {:keys [dummy?]}] (:rum/args state)]
             (state/set-edit-content!
              (if dummy?
                (string/triml content)
                (string/trim content))))
           state)
   :did-mount (fn [state]
                (let [[content opts id] (:rum/args state)]
                  (handler/restore-cursor-pos! id content (:dummy? opts)))
                state)}
  [content {:keys [on-hide dummy?]
            :or {dummy? false}} id]
  (let [value (rum/react state/edit-content)]
    (ui/textarea
     {:id id
      :on-change (fn [e]
                   (state/set-edit-content! (util/evalue e)))
      :value value
      :auto-focus true
      :style {:border "none"
              :border-radius 0
              :background "transparent"
              :padding 0}
      :on-key-down #(handler/reset-cursor-pos! id)
      :on-click #(handler/reset-cursor-pos! id)})))
