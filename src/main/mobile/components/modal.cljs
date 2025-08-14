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
            [logseq.shui.hooks :as hooks]
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
        close! #(reset! mobile-state/*singleton-modal nil)
        block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))
        open? (and open? block)
        [favorited? set-favorited!] (hooks/use-state false)]

    (hooks/use-effect!
     (fn []
       (set-favorited! (page-handler/favorited? (str (:block/uuid block)))))
     [block])

    (hooks/use-effect!
     (fn []
       (when open?
         (state/clear-edit!)
         (init/keyboard-hide)))
     [open?])

    (silkhq/depth-sheet
     {:presented (boolean open?)
      :onPresentedChange (fn [v?]
                           (when (false? v?)
                             (mobile-state/set-singleton-modal! nil)
                             (state/clear-edit!)
                             (state/pub-event! [:mobile/keyboard-will-hide])))}
     (silkhq/depth-sheet-portal
      (silkhq/depth-sheet-view
       {:class "block-modal-page"
        :inertOutside false}
       (silkhq/depth-sheet-backdrop)
       (silkhq/depth-sheet-content
        {:class "app-silk-depth-sheet-content"}
        (silkhq/scroll
         {:as-child true}
         (silkhq/scroll-view
          {:class "app-silk-scroll-view"
           :scrollGestureTrap {:yEnd true}}
          (silkhq/scroll-content
           {:class "app-silk-scroll-content"}

           [:div.app-silk-scroll-content-inner
            [:div.flex.justify-between.items-center.block-modal-page-header
             (shui/button
              {:variant :text
               :size :sm
               :on-click close!
               :class "-ml-2"}
              (shui/tabler-icon "chevron-down" {:size 24}))

             [:span.flex.items-center
              (when-let [block-id-str (str (:block/uuid block))]
                (shui/button
                 {:variant :text
                  :size :sm
                  :class (when favorited? "!text-yellow-800")
                  :on-click #(-> (if favorited?
                                   (page-handler/<unfavorite-page! block-id-str)
                                   (page-handler/<favorite-page! block-id-str))
                                 (p/then (fn [] (set-favorited! (not favorited?)))))}
                 (shui/tabler-icon (if favorited? "star-filled" "star") {:size 20})))
              (shui/button
               {:variant :text
                :size :sm
                :on-click (fn []
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
               (shui/tabler-icon "dots-vertical" {:size 20}))]]

            ;; block page content
            [:div.block-modal-page-content
             (mobile-ui/classic-app-container-wrap
              (page/page-cp (db/entity [:block/uuid (:block/uuid block)])))]])))))))))
