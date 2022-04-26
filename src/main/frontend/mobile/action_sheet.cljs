(ns frontend.mobile.action-sheet 
  (:require
   [frontend.extensions.srs :as srs]
   [frontend.handler.editor :as editor-handler]
   [frontend.mixins :as mixins]
   [frontend.state :as state]
   [frontend.ui :as ui]
   [rum.core :as rum]))

(defonce font-size 23)

(rum/defcs action-bar < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (state/set-state! :mobile/show-action-bar? false)))))
  [state]
  (when-let [block (state/sub :mobile/actioned-block)]
    (let [block-id   (:block/uuid block)
          properties (:block/properties block)
          heading?   (true? (:heading properties))]
     [:div.fixed.action-bar
      [:button.bottom-action.flex-row
       {:on-click (fn [_event]
                    (editor-handler/delete-block-aux! block true)
                    (state/set-state! :mobile/show-action-bar? false))}
       (ui/icon "trash" {:style {:fontSize font-size}})
       [:div.description "Delete"]]
      
      [:button.bottom-action.flex-row
       {:on-click (fn [_event]
                    (editor-handler/copy-selection-blocks)
                    (state/set-state! :mobile/show-action-bar? false))}
       (ui/icon "copy" {:style {:fontSize font-size}})
       [:div.description "Copy"]]
      
      [:button.bottom-action.flex-row
       {:on-click (fn [_event]
                    (srs/make-block-a-card! (:block/uuid block))
                    (state/set-state! :mobile/show-action-bar? false))}
       (ui/icon "infinity" {:style {:fontSize font-size}})
       [:div.description "Card"]]
      
      [:button.bottom-action.flex-row
       {:on-click (fn [_event]
                    (if heading?
                      (editor-handler/remove-block-property! block-id :heading)
                      (editor-handler/set-block-property! block-id :heading true))
                    (state/set-state! :mobile/show-action-bar? false))}
       (ui/icon "replace" {:style {:fontSize font-size}})
       [:div.description "Heading"]]])))
