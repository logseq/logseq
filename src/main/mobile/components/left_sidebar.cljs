(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [frontend.components.left-sidebar :as app-left-sidebar]
            [logseq.shui.silkhq :as silkhq]
            [mobile.bottom-tabs :as bottom-tabs]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc sidebar-content
  []
  [:div.w-full.app-silk-popup-content-inner.px-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container.mt-11
     {:class "!gap-4"}
     (app-left-sidebar/sidebar-favorites)
     (app-left-sidebar/sidebar-recent-pages)]]])

(rum/defc left-sidebar < rum/reactive
  []
  (when (empty? (rum/react mobile-state/*modal-blocks))
    (let [open? (rum/react mobile-state/*left-sidebar-open?)]
      (when open?
        (bottom-tabs/hide!))
      (silkhq/sidebar-sheet
       {:presented (boolean open?)
        :onPresentedChange (fn [v]
                             (when (false? v)
                               (mobile-state/close-left-sidebar!)
                               (bottom-tabs/show!)))}
       (silkhq/sidebar-sheet-portal
        (silkhq/sidebar-sheet-view
         {:class "app-silk-sidebar-sheet-view"}
         (silkhq/sidebar-sheet-backdrop)
         (silkhq/sidebar-sheet-content
          {:class "app-silk-sidebar-sheet-content"}
          (silkhq/sidebar-sheet-handle)
          (sidebar-content))))))))
