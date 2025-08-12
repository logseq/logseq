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
        close! #(swap! mobile-state/*singleton-modal assoc :open? false)
        block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))
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
            (silkhq/scroll {:as-child true}
              (silkhq/scroll-view
                {:class "app-silk-scroll-view"
                 :scrollGestureTrap {:yEnd true}}
                (silkhq/scroll-content
                  {:class "app-silk-scroll-content"}

                  [:div.app-silk-scroll-content-inner
                   [:div.flex.justify-between.items-center.block-modal-page-header
                    [:a.opacity-40.active:opacity-60.px-2
                     {:on-pointer-down close!}
                     (shui/tabler-icon "chevron-down" {:size 18 :stroke 3})]

                    [:span.flex.items-center.gap-2
                     (when-let [block-id-str (str (:block/uuid block))]
                       [:a.active:opacity-80.pr-1
                        {:class (if favorited? "opacity-80 !text-yellow-800" "opacity-40")
                         :on-click #(-> (if favorited?
                                          (page-handler/<unfavorite-page! block-id-str)
                                          (page-handler/<favorite-page! block-id-str))
                                      (p/then (fn [] (set-favorited! (not favorited?)))))}
                        (shui/tabler-icon (if favorited? "star-filled" "star") {:size 18 :stroke 2})])
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
                      (shui/tabler-icon "dots-vertical" {:size 18 :stroke 2})]]]

                   ;; block page content
                   [:div.block-modal-page-content
                    (when open?
                      (mobile-ui/classic-app-container-wrap
                        (page/page-cp (db/entity [:block/uuid (:block/uuid block)]))))]])))
            ))))))
