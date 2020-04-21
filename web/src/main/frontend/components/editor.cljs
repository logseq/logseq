(ns frontend.components.editor
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.image :as image]
            [frontend.ui :as ui]))

(rum/defc box <
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      nil
      :show-fn (fn []
                 (:edit? @state/state))
      :on-hide (:on-hide (second (:rum/args state))))))
  {:did-mount (fn [state]
                (when-let [content (first (:rum/args state))]
                  (handler/restore-cursor-pos! content))
                state)
   :will-unmount (fn [state]
                   (handler/clear-edit!)
                   state)}
  [content {:keys [on-hide]}]
  [:div.flex-1
   (ui/textarea
    {:id "edit-box"
     :on-change (fn [e]
                  (handler/set-edit-content! (util/evalue e)))
     :initial-value content
     :value-atom state/edit-content
     :auto-focus true
     :style {:border "none"
             :border-radius 0
             :background "transparent"
             :margin-top 12.5}
     :on-key-down handler/reset-cursor-pos!
     :on-click handler/reset-cursor-pos!})
   [:input
    {:id "files"
     :type "file"
     :on-change (fn [e]
                  (let [files (.-files (.-target e))]
                    (image/upload
                     files
                     (fn [file file-name file-type]
                       (handler/request-presigned-url
                        file file-name file-type
                        (fn [signed-url]
                          ;; insert into the text
                          (handler/insert-image! signed-url)))))))
     :hidden true}]])
