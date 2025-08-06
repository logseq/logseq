(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [frontend.components.container :as container]
            [logseq.shui.silkhq :as silkhq]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc left-sidebar < rum/reactive
  []
  (let [open? (rum/react mobile-state/*left-sidebar-open?)]
    (silkhq/sidebar-sheet
     {:presented (boolean open?)
      :onPresentedChange (fn [v]
                           (when (false? v)
                             (mobile-state/close-left-sidebar!)))}
     (silkhq/sidebar-sheet-portal
      (silkhq/sidebar-sheet-view
       {:class "app-silk-sidebar-sheet-view"}
       (silkhq/sidebar-sheet-backdrop)
       (silkhq/sidebar-sheet-content
        {:class "flex flex-col items-center p-2"}
        (silkhq/sidebar-sheet-handle)
        [:div.w-full.app-silk-popup-content-inner.p-2
         [:div.left-sidebar-inner
          [:div.sidebar-contents-container.mt-8
           (container/sidebar-favorites)
           (container/sidebar-recent-pages)]]]))))))
