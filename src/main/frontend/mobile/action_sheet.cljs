(ns frontend.mobile.action-sheet 
  (:require
   [frontend.handler.editor :as editor-handler]
   [frontend.state :as state]
   [frontend.ui :as ui]
   [rum.core :as rum]))

(rum/defc action-bar < rum/reactive
  []
  (when-let [block (state/sub :mobile/actioned-block)]
    (prn :action-bar :block block)
    [:div.fixed.action-bar
     [:button.bottom-action.flex-row
      {:on-click (fn [_event]
                   (editor-handler/delete-block-aux! block true)
                   (state/set-state! :mobile/show-action-bar? false))}
      (ui/icon "trash" {:style {:fontSize 25}})
      [:div "Delete"]]
     [:button.bottom-action.flex-row
      (ui/icon "calendar-plus" {:style {:fontSize 25}})
      [:div "Schedule"]]
     [:button.bottom-action.flex-row
      (ui/icon "calendar-minus" {:style {:fontSize 25}})
      [:div "Deadline"]]]))
