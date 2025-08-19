(ns mobile.components.modal
  "Mobile modal"
  (:require ["../externals.js"]
            [cljs-bean.core :as bean]
            [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.ui :as shui]
            [mobile.components.ui :as mobile-ui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc back-or-close-button < rum/reactive
  []
  (let [block-modal (rum/react mobile-state/*modal-blocks)
        blocks-history (rum/react mobile-state/*blocks-navigation-history)
        back? (and (seq block-modal)
                   (> (count blocks-history) 1))]
    (shui/button
     {:variant :text
      :size :sm
      :on-click (fn [_e]
                  (if back?
                    (mobile-state/pop-navigation-history!)
                    (mobile-state/close-block-modal!)))
      :class "-ml-2"}
     (shui/tabler-icon (if back? "arrow-left" "chevron-down") {:size 24}))))

(rum/defc block-cp
  [block {:keys [favorited? set-favorited!]}]
  (let [close! mobile-state/close-block-modal!]
    [:div.app-silk-scroll-content-inner
     [:div.flex.justify-between.items-center.block-modal-page-header
      (back-or-close-button)

      [:span.flex.items-center.-mr-2
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
                       :default-height false
                       :type :action-sheet}))}
        (shui/tabler-icon "dots-vertical" {:size 20}))]]

     ;; block page content
     [:div.block-modal-page-content
      (mobile-ui/classic-app-container-wrap
       (page/page-cp (db/entity [:block/uuid (:block/uuid block)])))]]))

(defn setup-sidebar-touch-swipe! []
  (let [touch-start-x (atom 0)
        touch-start-y (atom 0)
        has-triggered? (atom false)
        edge-threshold 30
        swipe-trigger-distance 50
        max-vertical-drift 50

        on-touch-start (fn [^js e]
                         (let [touch (aget e "touches" 0)]
                           (reset! touch-start-x (.-pageX touch))
                           (reset! touch-start-y (.-pageY touch))
                           (reset! has-triggered? false)))

        on-touch-move (fn [^js e]
                        (when-not @has-triggered?
                          (let [touch (aget e "touches" 0)
                                delta-x (- (.-pageX touch) @touch-start-x)
                                delta-y (js/Math.abs (- (.-pageY touch) @touch-start-y))
                                started-from-edge (<= @touch-start-x edge-threshold)
                                is-horizontal-swipe (and (> delta-x swipe-trigger-distance)
                                                         (< delta-y max-vertical-drift))]
                            (when (and started-from-edge is-horizontal-swipe)
                              (reset! has-triggered? true)
                              (mobile-state/pop-navigation-history!)))))]

    (.addEventListener js/document "touchstart" on-touch-start #js {:passive true})
    (.addEventListener js/document "touchmove" on-touch-move #js {:passive true})

    ;; Return cleanup function
    #(do
       (.removeEventListener js/document "touchstart" on-touch-start)
       (.removeEventListener js/document "touchmove" on-touch-move))))

(rum/defc block-sheet
  [block]
  (let [block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))
        open? (boolean block)
        [favorited? set-favorited!] (hooks/use-state false)]

    (hooks/use-effect!
     (fn []
       (setup-sidebar-touch-swipe!))
     [])

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
                             (mobile-state/close-block-modal!)
                             (state/clear-edit!)
                             (state/pub-event! [:mobile/keyboard-will-hide])))}
     (silkhq/depth-sheet-portal
      (silkhq/depth-sheet-view
       {:class "block-modal-page"
        :inertOutside true
        :onClickOutside (bean/->js {:dismiss false
                                    :stopOverlayPropagation false})}
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

           (block-cp block {:favorited? favorited?
                            :set-favorited! set-favorited!}))))))))))

(rum/defc blocks-modal < rum/reactive
  []
  (let [blocks (rum/react mobile-state/*modal-blocks)
        light-theme? (= "light" (:ui/theme @state/state))]
    (when light-theme?
      (if (seq blocks)
        (util/set-theme-dark)
        (util/set-theme-light)))
    (block-sheet (first blocks))))
