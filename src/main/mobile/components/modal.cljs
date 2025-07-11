(ns mobile.components.modal
  "Mobile modal"
  (:require ["../externals.js"]
            [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db.frontend.entity-util :as entity-util]
            [mobile.components.ui :as mobile-ui]
            [mobile.init :as init]
            [mobile.ionic :as ion]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc block-modal < rum/reactive
  [presenting-element]
  (let [{:keys [open? block]} (rum/react mobile-state/*modal-data)
        close! #(swap! mobile-state/*modal-data assoc :open? false)
        block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))
        open? (and open? block)]
    (when open?
      (state/clear-edit!)
      (init/keyboard-hide))
    (ion/modal
     {:isOpen (boolean open?)
      :presenting-element presenting-element
      :onDidDismiss (fn []
                      (mobile-state/set-modal! nil)
                      (state/clear-edit!)
                      (state/pub-event! [:mobile/keyboard-will-hide]))
      :mode "ios"                                          ;; force card modal for android
      :expand "block"}

     (ion/page
      {:class "block-modal-page"}
      (ion/header
       [:span.opacity-40.active:opacity-60
        {:on-click close!}
        (ion/tabler-icon "chevron-down" {:size 16 :stroke 3})]
       [:span.opacity-40.active:opacity-60
        {:on-click (fn []
                     (mobile-ui/open-popup!
                      (fn []
                        [:div.-mx-2
                         (ui/menu-link
                          {:on-click (fn []
                                       (mobile-ui/open-modal!
                                        (str "⚠️ Are you sure you want to delete this "
                                             (if (entity-util/page? block) "page" "block")
                                             "?")
                                        {:type :alert
                                         :on-action (fn [{:keys [role]}]
                                                      (when (not= role "cancel")
                                                        (mobile-ui/close-popup!)
                                                        (some->
                                                         (:block/uuid block)
                                                         (page-handler/<delete!
                                                          (fn [] (close!))
                                                          {:error-handler
                                                           (fn [{:keys [msg]}]
                                                             (notification/show! msg :warning))}))))
                                         :buttons [{:text "Cancel"
                                                    :role "cancel"}
                                                   {:text "Ok"
                                                    :role "confirm"}]}))}
                          [:span.text-lg.flex.gap-2.items-center
                           (ion/tabler-icon "trash" {:class "opacity-80" :size 18})
                           "Delete"])

                         (ui/menu-link
                          {:on-click #(mobile-ui/close-popup!)}
                          [:span.text-lg.flex.gap-2.items-center
                           (ion/tabler-icon "copy" {:class "opacity-80" :size 18})
                           "Copy"])])
                      {:title "Actions"
                       :modal-props {:initialBreakpoint 0.3}}))}
        (ion/tabler-icon "dots-vertical" {:size 18 :stroke 2})])

      (ion/content {:class "ion-padding scrolling"}
                   (mobile-ui/classic-app-container-wrap
                    (page/page-cp (db/entity [:block/uuid (:block/uuid block)]))))))))
