(ns mobile.components.app
  "App root"
  (:require ["../externals.js"]
            [frontend.components.journal :as journal]
            [frontend.handler.common :as common-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.toaster.core :as shui-toaster]
            [logseq.shui.ui :as shui]
            [mobile.bottom-tabs :as bottom-tabs]
            [mobile.components.editor-toolbar :as editor-toolbar]
            [mobile.components.header :as mobile-header]
            [mobile.components.left-sidebar :as mobile-left-sidebar]
            [mobile.components.modal :as modal]
            [mobile.components.popup :as popup]
            [mobile.components.search :as search]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.components.settings :as settings]
            [mobile.components.ui :as ui-component]
            [mobile.components.ui-silk :as ui-silk]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(defn- sidebar-not-allowed-to-open?
  []
  (or (seq @mobile-state/*modal-blocks)
      (seq @mobile-state/*popup-data)
      (:mobile/show-action-bar? @state/state)
      (state/editing?)))

(defn- setup-sidebar-touch-swipe!
  []
  (let [touch-start-x (atom 0)
        touch-start-y (atom 0)
        has-triggered? (atom false)
        blocking-scroll? (atom false)
        sidebar-initial-open? (atom false)
        max-x (atom 0)
        max-y (atom 0)
        min-y (atom 0)
        swipe-trigger-distance 50         ;; distance to actually open/close
        horiz-intent-threshold 10         ;; start blocking scroll when horizontal intent is clear
        max-vertical-drift 30
        on-touch-start (fn [^js e]
                         (when-not (sidebar-not-allowed-to-open?)
                           (let [t (aget e "touches" 0)]
                             (reset! sidebar-initial-open? (mobile-state/left-sidebar-open?))
                             (reset! touch-start-x (.-pageX t))
                             (reset! touch-start-y (.-pageY t))
                             (reset! has-triggered? false)
                             (reset! blocking-scroll? false)
                             (reset! max-x 0)
                             (reset! max-y (.-pageY t))
                             (reset! min-y (.-pageY t)))))

        on-touch-move (fn [^js e]
                        (when-not (sidebar-not-allowed-to-open?)
                          (let [t (aget e "touches" 0)
                                _ (reset! max-x (max (.-pageX t) @max-x))
                                _ (reset! max-y (max (.-pageY t) @max-y))
                                _ (reset! min-y (min (.-pageY t) @min-y))
                                dx (- (.-pageX t) @touch-start-x)
                                dy (js/Math.abs (- @max-y @min-y))
                                abs-dx (js/Math.abs dx)
                                horizontal-intent (and (> abs-dx horiz-intent-threshold)
                                                       (> abs-dx dy))
                                open-swipe? (and (> dx swipe-trigger-distance)
                                                 (< dy max-vertical-drift))
                                close-swipe? (and (not @sidebar-initial-open?)
                                                  (mobile-state/left-sidebar-open?)
                                                  (> (- @max-x (.-pageX t)) swipe-trigger-distance)
                                                  (< dy max-vertical-drift))]

                             ;; Block vertical scroll as soon as horizontal intent is clear
                            (when (or @blocking-scroll? (and horizontal-intent
                                                             (not @sidebar-initial-open?)
                                                             (mobile-state/left-sidebar-open?)))
                              (reset! blocking-scroll? true)
                              (.preventDefault e))

                            (cond
                              (and open-swipe? (not @has-triggered?))
                              (do (reset! has-triggered? true)
                                  (mobile-state/open-left-sidebar!))

                              close-swipe?
                              (mobile-state/close-left-sidebar!)))))

        on-touch-end (fn [_]
                       (reset! blocking-scroll? false))]

    ;; passive:false so preventDefault works
    (.addEventListener js/document "touchstart" on-touch-start #js {:passive false})
    (.addEventListener js/document "touchmove"  on-touch-move  #js {:passive false})
    (.addEventListener js/document "touchend"   on-touch-end   #js {:passive false})
    (.addEventListener js/document "touchcancel" on-touch-end  #js {:passive false})

    ;; cleanup
    #(do
       (.removeEventListener js/document "touchstart" on-touch-start)
       (.removeEventListener js/document "touchmove"  on-touch-move)
       (.removeEventListener js/document "touchend"   on-touch-end)
       (.removeEventListener js/document "touchcancel" on-touch-end))))

(rum/defc journals
  []
  (hooks/use-effect!
   (fn []
     (setup-sidebar-touch-swipe!)) [])
  (ui-component/classic-app-container-wrap
   [:div.pt-3
    (journal/all-journals)]))

(rum/defc home-inner
  [*page db-restoring? current-tab]
  [:div {:id "app-main-content"
         :ref *page}

   ;; main content
   (if db-restoring?
     [:div.space-y-2.mt-8.mx-0.opacity-75
      (shui/skeleton {:class "h-10 w-full mb-6 bg-gray-200"})
      (shui/skeleton {:class "h-6 w-full bg-gray-200"})
      (shui/skeleton {:class "h-6 w-full bg-gray-200"})]
     (if (= current-tab "search")
       [:div]
       (journals)))])

(rum/defc home < rum/reactive
  {:did-mount (fn [state]
                (ui/inject-document-devices-envs!)
                state)}
  [*page current-tab]
  (let [db-restoring? (state/sub :db/restoring?)]
    (home-inner *page db-restoring? current-tab)))

(defn use-theme-effects!
  [current-repo]
  (let [[theme] (frum/use-atom-in state/state :ui/theme)]
    (hooks/use-effect!
     (fn []
       (state/sync-system-theme!)
       (ui/setup-system-theme-effect!))
     [])
    (hooks/use-effect!
     #(let [^js doc js/document.documentElement
            ^js cls (.-classList doc)
            ^js cls-body (.-classList js/document.body)]
        (.setAttribute doc "data-theme" theme)
        (if (= theme "dark")                               ;; for tailwind dark mode
          (do (.add cls "dark") (.add cls "ion-palette-dark")
              (doto cls-body (.remove "light-theme") (.add "dark-theme")))
          (do (.remove cls "dark") (.remove cls "ion-palette-dark")
              (doto cls-body (.remove "dark-theme") (.add "light-theme")))))
     [theme]))

  (hooks/use-effect!
   (fn []
     (some-> js/window.externalsjs (.settleStatusBar)))
   [current-repo]))

(defn use-screen-size-effects!
  []
  (hooks/use-effect!
   (fn []
     (let [handle-size! (fn []
                          (.setProperty (.-style js/document.body) "--ls-full-screen-height" (str js/window.screen.height "px")))]
       (handle-size!)
       (.addEventListener js/window "orientationchange" handle-size!)
       #(.removeEventListener js/window "orientationchange" handle-size!)))
   []))

(rum/defc app
  [current-repo {:keys [login?]}]
  (let [[tab] (mobile-state/use-tab)
        *home (rum/use-ref nil)]
    (use-screen-size-effects!)
    (use-theme-effects! current-repo)
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (bottom-tabs/configure))
       (when-let [element (util/mobile-page-scroll)]
         (common-handler/listen-to-scroll! element))) [])
    (silkhq/depth-sheet-stack
     {:as-child true}
     (silkhq/depth-sheet-scenery-outlets
      (silkhq/scroll {:as-child true}
                     (silkhq/scroll-view
                      {:class "app-silk-index-scroll-view"
                       :pageScroll true
                       :nativePageScrollReplacement false}
                      (silkhq/scroll-content
                       {:class "app-silk-index-scroll-content"}
                       [:div.app-silk-index-container
                        {:data-tab (str tab)}
                        (case (keyword tab)
                          :home
                          (home *home tab)
                          :settings
                          (settings/page)
                          :search
                          (search/search)
                          "Not Found")])))

      (mobile-header/header tab login?)

      (mobile-left-sidebar/left-sidebar)

      ;; bottom tabs
      (when-not (mobile-util/native-ios?)
        (ui-silk/app-silk-tabs))

      (ui-component/keep-keyboard-virtual-input)
      (ui-component/install-notifications)
      (ui-component/install-modals)

      (shui-toaster/install-toaster)
      (shui-dialog/install-modals)
      (shui-popup/install-popups)
      (modal/blocks-modal)
      (popup/popup)))))

(rum/defc main < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)
        login? (and (state/sub :auth/id-token)
                    (user-handler/logged-in?))
        show-action-bar? (state/sub :mobile/show-action-bar?)]
    [:<>
     (app current-repo {:login? login?})
     (editor-toolbar/mobile-bar)
     (when show-action-bar?
       (selection-toolbar/action-bar))]))
