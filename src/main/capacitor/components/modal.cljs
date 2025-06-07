(ns capacitor.components.modal
  (:require ["../externals.js"]
            [capacitor.components.ui :as ui]
            [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.mobile.action-bar :as action-bar]
            [frontend.mobile.mobile-bar :as mobile-bar]
            [frontend.state :as fstate]
            [rum.core :as rum]))

(rum/defc modal < rum/reactive
  [presenting-element]
  (let [{:keys [open? block]} (rum/react state/*modal-data)
        show-action-bar? (fstate/sub :mobile/show-action-bar?)]
    (ion/modal
     {:isOpen (boolean open?)
      :presenting-element presenting-element
      :onDidDismiss (fn [] (state/set-modal! nil))
      :expand "block"}
     (ion/content {:class "ion-padding scrolling"}
                  (ui/classic-app-container-wrap
                   (page/page-cp (db/entity [:block/uuid (:block/uuid block)])))
                  (mobile-bar/mobile-bar)
                  (when show-action-bar?
                    (action-bar/action-bar))))))
