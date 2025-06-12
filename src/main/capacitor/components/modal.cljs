(ns capacitor.components.modal
  (:require ["../externals.js"]
            [capacitor.components.ui :as ui]
            [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.ui :as frontend-ui]
            [frontend.mobile.action-bar :as action-bar]
            [frontend.mobile.mobile-bar :as mobile-bar]
            [frontend.state :as fstate]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc block-modal < rum/reactive
  [presenting-element]
  (let [{:keys [open? block]} (rum/react state/*modal-data)
        show-action-bar? (fstate/sub :mobile/show-action-bar?)]
    (ion/modal
      {:isOpen (boolean open?)
       :presenting-element presenting-element
       :onDidDismiss (fn [] (state/set-modal! nil))
       :mode "ios"                                          ;; force card modal for android
       :expand "block"}

      (ion/page
        {:class "block-modal-page"}
        (ion/header
          [:span.opacity-40.active:opacity-60
           {:on-click #(swap! state/*modal-data assoc :open? false)}
           (ion/tabler-icon "chevron-down" {:size 16 :stroke 3})]
          [:span.opacity-40.active:opacity-60
           {:on-click (fn []
                        (ui/open-popup!
                          (fn []
                            [:div.-mx-2
                             (frontend-ui/menu-link
                               {:on-click #(ui/close-popup!)}
                               [:span.text-lg.flex.gap-2.items-center
                                (ion/tabler-icon "trash" {:class "opacity-80" :size 18})
                                "Delete"])

                             (frontend-ui/menu-link
                               {:on-click #(ui/close-popup!)}
                               [:span.text-lg.flex.gap-2.items-center
                                (ion/tabler-icon "copy" {:class "opacity-80" :size 18})
                                "Copy"])])
                          {:title "Actions"
                           :modal-props {:initialBreakpoint 0.3}})
                        )}
           (ion/tabler-icon "dots-vertical" {:size 18 :stroke 2})])

        (ion/content {:class "ion-padding scrolling"}
          (ui/classic-app-container-wrap
            (page/page-cp (db/entity [:block/uuid (:block/uuid block)])))
          (mobile-bar/mobile-bar)
          (when show-action-bar?
            (action-bar/action-bar)))))))
