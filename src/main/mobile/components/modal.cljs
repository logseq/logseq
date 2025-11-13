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
            [mobile.bottom-tabs :as bottom-tabs]
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

(defn- skip-touch-check?
  []
  (or (seq @mobile-state/*popup-data)
      (:mobile/show-action-bar? @state/state)
      (state/editing?)))

(defn- setup-sidebar-touch-swipe!
  [ref]
  (let [touch-start-x (atom 0)
        touch-start-y (atom 0)
        has-triggered? (atom false)
        blocking-scroll? (atom false)
        max-y (atom 0)
        min-y (atom 0)
        swipe-trigger-distance 50         ;; when to actually open sidebar
        horiz-intent-threshold 10         ;; when to start blocking scroll
        max-vertical-drift 50
        on-touch-start (fn [^js e]
                         (when-not (skip-touch-check?)
                           (let [t (aget e "touches" 0)]
                             (reset! touch-start-x (.-pageX t))
                             (reset! touch-start-y (.-pageY t))
                             (reset! has-triggered? false)
                             (reset! blocking-scroll? false)
                             (reset! max-y (.-pageY t))
                             (reset! min-y (.-pageY t)))))

        on-touch-move (fn [^js e]
                        (when-not (skip-touch-check?)
                          (let [t (aget e "touches" 0)
                                dx (- (.-pageX t) @touch-start-x)
                                dy (js/Math.abs (- @max-y @min-y))
                                _ (reset! max-y (max (.-pageY t) @max-y))
                                _ (reset! min-y (min (.-pageY t) @min-y))
                                horizontal-intent (and (> dx horiz-intent-threshold)
                                                       (> dx dy))
                                is-horizontal-swipe (and (> dx swipe-trigger-distance)
                                                         (< dy max-vertical-drift))]
                            ;; as soon as we detect horizontal intent, block vertical scrolling
                            (when (or @blocking-scroll? horizontal-intent)
                              (reset! blocking-scroll? true)
                              (.preventDefault e))       ;; <-- stops page from scrolling

                            (when (and (not @has-triggered?)
                                       is-horizontal-swipe)
                              (reset! has-triggered? true)
                              (mobile-state/pop-navigation-history!)))))

        on-touch-end (fn [_]
                       (reset! blocking-scroll? false))]

    ;; IMPORTANT: passive:false so preventDefault actually works
    (.addEventListener ref "touchstart" on-touch-start #js {:passive false})
    (.addEventListener ref "touchmove"  on-touch-move  #js {:passive false})
    (.addEventListener ref "touchend"   on-touch-end   #js {:passive false})
    (.addEventListener ref "touchcancel" on-touch-end  #js {:passive false})

    ;; cleanup
    #(do
       (.removeEventListener ref "touchstart" on-touch-start)
       (.removeEventListener ref "touchmove"  on-touch-move)
       (.removeEventListener ref "touchend"   on-touch-end)
       (.removeEventListener ref "touchcancel" on-touch-end))))

(rum/defc block-cp
  [block]
  [:<>
   (mobile-ui/keep-keyboard-virtual-input "in-modal")
   [:div.app-silk-scroll-content-inner
    ;; block page content
    [:div.block-modal-page-content
     (mobile-ui/classic-app-container-wrap
      (page/page-cp (db/entity [:block/uuid (:block/uuid block)])))]]])

(rum/defc block-sheet-topbar
  [block {:keys [favorited? set-favorited!]}]

  (let [close! mobile-state/close-block-modal!]
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
       (shui/tabler-icon "dots-vertical" {:size 20}))]]))

(rum/defc sheet-content
  [block favorited? set-favorited!]
  (let [*ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (when-let [ref (rum/deref *ref)]
         (setup-sidebar-touch-swipe! ref)))
     [(rum/deref *ref)])
    (silkhq/depth-sheet-content
     {:class "app-silk-depth-sheet-content"
      :ref *ref}
     (block-sheet-topbar block {:favorited? favorited?
                                :set-favorited! set-favorited!})
     (silkhq/scroll
      {:as-child true}
      (silkhq/scroll-view
       {:class "app-silk-scroll-view"
        :scrollGestureTrap {:yEnd true}}
       (silkhq/scroll-content
        {:class "app-silk-scroll-content"}
        (block-cp block)))))))

(rum/defc block-sheet
  [block]
  (let [block (when-let [id (:block/uuid block)]
                (db/entity [:block/uuid id]))
        open? (boolean block)
        [favorited? set-favorited!] (hooks/use-state false)]
    (hooks/use-effect!
     (fn []
       (set-favorited! (page-handler/favorited? (str (:block/uuid block)))))
     [block])

    (hooks/use-effect!
     (fn []
       (when open?
         (bottom-tabs/hide!)
         (state/clear-edit!)
         (init/keyboard-hide)))
     [open?])

    (silkhq/depth-sheet
     {:presented (boolean open?)
      :onPresentedChange (fn [v?]
                           (when (false? v?)
                             (mobile-state/close-block-modal!)
                             (state/clear-edit!)
                             (state/pub-event! [:mobile/keyboard-will-hide])
                             (bottom-tabs/show!)))}
     (silkhq/depth-sheet-portal
      (silkhq/depth-sheet-view
       {:class "block-modal-page"
        :inertOutside true
        :onClickOutside (bean/->js {:dismiss false
                                    :stopOverlayPropagation false})}
       (silkhq/depth-sheet-backdrop)
       (sheet-content block favorited? set-favorited!))))))

(rum/defc blocks-modal < rum/reactive
  []
  (let [blocks (rum/react mobile-state/*modal-blocks)
        light-theme? (= "light" (:ui/theme @state/state))]
    (when light-theme?
      (if (seq blocks)
        (util/set-theme-dark)
        (util/set-theme-light)))
    (block-sheet (first blocks))))
