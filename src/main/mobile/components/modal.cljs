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
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.ui :as shui]
            [mobile.components.ui :as mobile-ui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc block-modal
  []
  (let [[{:keys [open? block]}] (mobile-state/use-singleton-modal)
        close! #(swap! mobile-state/*singleton-modal assoc :open? false)
        block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))]

    (when open?
      (state/clear-edit!)
      (init/keyboard-hide))

    (silkhq/bottom-sheet
     {:presented (boolean open?)
      :onPresentedChange (fn [v?]
                           (when (false? v?)
                             (mobile-state/set-singleton-modal! nil)
                             (state/clear-edit!)
                             (state/pub-event! [:mobile/keyboard-will-hide])))}
     (silkhq/bottom-sheet-portal
      (silkhq/bottom-sheet-view
       {:class "block-modal-page"
        :inertOutside false}
       (silkhq/bottom-sheet-backdrop)
       (silkhq/bottom-sheet-content
        {:class "app-silk-sheet-scroll-content"}
        (silkhq/scroll {:as-child true}
                       (silkhq/scroll-view
                        {:class "app-silk-scroll-view"}
                        (silkhq/scroll-content
                         {:class "app-silk-scroll-content"}
                         [:div.app-silk-scroll-content-inner
                          [:div.flex.justify-between.items-center.block-modal-page-header
                           [:a.opacity-40.active:opacity-60.px-2
                            {:on-pointer-down close!}
                            (shui/tabler-icon "chevron-down" {:size 18 :stroke 3})]
                           [:a.opacity-40.active:opacity-60.pr-1
                            {:on-pointer-down (fn []
                                                (mobile-ui/open-popup!
                                                 (fn []
                                                   [:div.-mx-2
                                                    (ui/menu-link
                                                     {:on-click #(mobile-ui/close-popup!)}
                                                     [:span.text-lg.flex.gap-2.items-center
                                                      (shui/tabler-icon "copy" {:class "opacity-80" :size 22})
                                                      "Copy"])

                                                    (ui/menu-link
                                                     {:on-click #(-> (shui/dialog-confirm!
                                                                      (str "⚠️ Are you sure you want to delete this "
                                                                           (if (entity-util/page? block) "page" "block")
                                                                           "?"))
                                                                     (p/then
                                                                      (fn []
                                                                        (mobile-ui/close-popup!)
                                                                        (some->
                                                                         (:block/uuid block)
                                                                         (page-handler/<delete!
                                                                          (fn [] (close!))
                                                                          {:error-handler
                                                                           (fn [{:keys [msg]}]
                                                                             (notification/show! msg :warning))})))))}
                                                     [:span.text-lg.flex.gap-2.items-center.text-red-700
                                                      (shui/tabler-icon "trash" {:class "opacity-80" :size 22})
                                                      "Delete"])])
                                                 {:title "Actions"
                                                  :type :action-sheet}))}
                            (shui/tabler-icon "dots-vertical" {:size 18 :stroke 2})]]

                   ;; block page content
                          [:div.block-modal-page-content
                           (when open?
                             (mobile-ui/classic-app-container-wrap
                              (page/page-cp (db/entity [:block/uuid (:block/uuid block)]))))]])))))))))
