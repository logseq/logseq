(ns mobile.components.app
  "App root"
  (:require ["../externals.js"]
            [frontend.components.journal :as journal]
            [frontend.components.quick-add :as quick-add]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.toaster.core :as shui-toaster]
            [logseq.shui.ui :as shui]
            [mobile.bottom-tabs :as bottom-tabs]
            [mobile.components.editor-toolbar :as editor-toolbar]
            [mobile.components.favorites :as favorites]
            [mobile.components.graphs :as graphs]
            [mobile.components.header :as mobile-header]
            [mobile.components.popup :as popup]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.components.ui :as ui-component]
            [mobile.state :as mobile-state]
            [mobile.navigation :as mobile-nav]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc component-with-restoring < rum/static rum/reactive
  [component]
  (let [db-restoring? (state/sub :db/restoring?)]
    (if db-restoring?
      [:div.space-y-2.mt-8.mx-0.opacity-75
       (shui/skeleton {:class "h-10 w-full mb-6"})
       (shui/skeleton {:class "h-6 w-full"})
       (shui/skeleton {:class "h-6 w-full"})]
      component)))

(rum/defc home < rum/static
  {:did-mount (fn [state]
                (ui/inject-document-devices-envs!)
                state)}
  []
  (component-with-restoring (journal/all-journals)))

(defn use-theme-effects!
  [current-repo theme]
  (hooks/use-effect!
   (fn []
     (state/sync-system-theme!)
     (ui/setup-system-theme-effect!)
     (let [handler (fn [^js e]
                     (when (:ui/system-theme? @state/state)
                       (let [is-dark? (boolean (some-> e .-detail .-isDark))]
                         (state/set-theme-mode! (if is-dark? "dark" "light") true))))]
      (.addEventListener js/window "logseq:native-system-theme-changed" handler)
      #(.removeEventListener js/window "logseq:native-system-theme-changed" handler)))
   [])
  (hooks/use-effect!
   #(let [^js doc js/document.documentElement
          ^js cls (.-classList doc)
          ^js cls-body (.-classList js/document.body)]
      (.setAttribute doc "data-theme" theme)
      (if (= theme "dark")                               ;; for tailwind dark mode
        (do (.add cls "dark")
            (doto cls-body (.remove "light-theme") (.add "dark-theme")))
        (do (.remove cls "dark")
            (doto cls-body (.remove "dark-theme") (.add "light-theme")))))
   [theme])

  (hooks/use-effect!
   (fn []
     (some-> js/window.externalsjs (.settleStatusBar)))
   [current-repo]))

(defn use-gesture-navigation!
  []
  (let [gesture-ref (hooks/use-ref nil)
        edge-threshold 28
        swipe-threshold 64
        max-duration 650]
    (hooks/use-effect!
     (fn []
       (let [on-start (fn [^js e]
                        (let [touches (.-touches e)
                              count (.-length touches)]
                          (when (pos? count)
                            (let [t1 (.item touches 0)
                                  t2 (when (> count 1) (.item touches 1))
                                  now (.now js/Date)]
                              (set! (.-current gesture-ref)
                                    {:count count
                                     :x1 (.-clientX t1)
                                     :y1 (.-clientY t1)
                                     :x2 (some-> t2 .-clientX)
                                     :started-at now
                                     :edge-left (< (.-clientX t1) edge-threshold)
                                     :edge-right (> (.-clientX t1) (- js/window.innerWidth edge-threshold))})))))
             on-end (fn [^js e]
                      (when-let [st (.-current gesture-ref)]
                        (let [touches (.-changedTouches e)
                              idx (dec (max 1 (.-length touches)))
                              touch (.item touches idx)
                              end-x (.-clientX touch)
                              dx (- end-x (:x1 st))
                              elapsed (- (.now js/Date) (:started-at st))]
                          (when (<= elapsed max-duration)
                            (cond
                              (and (= (:count st) 2)
                                   (> (js/Math.abs dx) swipe-threshold))
                              (if (> dx 0)
                                (when (false? (mobile-nav/pop-modal!))
                                  (mobile-nav/pop-stack!))
                                (.forward js/history))

                              (and (= (:count st) 1)
                                   (> (js/Math.abs dx) swipe-threshold))
                              (cond
                                (and (:edge-left st) (> dx 0))
                                (state/toggle-left-sidebar!)

                                (and (:edge-right st) (< dx 0))
                                (state/open-right-sidebar!)))))
                        (set! (.-current gesture-ref) nil)))]
         (.addEventListener js/window "touchstart" on-start #js {:passive true})
         (.addEventListener js/window "touchend" on-end #js {:passive true})
         (fn []
           (.removeEventListener js/window "touchstart" on-start)
           (.removeEventListener js/window "touchend" on-end)))))
     [])))

(defn use-screen-size-effects!
  []
  (hooks/use-effect!
   (fn []
     (let [handle-size! (fn []
                          (.setProperty (.-style js/document.body)
                                        "--ls-full-screen-height"
                                        (str js/window.screen.height "px")))]
       (handle-size!)
       (.addEventListener js/window "orientationchange" handle-size!)
       #(.removeEventListener js/window "orientationchange" handle-size!)))
   []))

(rum/defc capture <
  {:did-mount (fn [state]
                (p/do!
                 (editor-handler/quick-add-ensure-new-block-exists!)
                 (when (mobile-util/native-ios?)
                   ;; FIXME: android doesn't open keyboard automatically
                   (editor-handler/quick-add-open-last-block!)))
                state)}
  []
  (quick-add/quick-add))

(rum/defc other-page < rum/static
  [route-view tab route-match]
  (let [page-view? (= (get-in route-match [:data :name]) :page)]
    [:div#main-content-container.pl-3.ls-layer
     {:class (if page-view? "pr-2" "pr-3")}
     (if route-view
       (route-view route-match)
       ;; NOTE: `case` caused IllegalArgumentException: Duplicate case test constant
       (cond
         (= tab "graphs") (graphs/page)
         (= tab "go to") (favorites/favorites)
         (= tab "search") nil
         (= tab "capture") (component-with-restoring (capture))))]))

(rum/defc main-content < rum/static
  [tab route-match]
  (let [view (get-in route-match [:data :view])
        home? (and (= tab "home") (nil? view))
        [quick-add-launched? set-quick-add-launched!] (hooks/use-state
                                                       (= @mobile-state/*app-launch-url
                                                          "logseq://mobile/go/quick-add"))]
    (hooks/use-effect!
     (fn []
       (when (and (= tab "home") quick-add-launched?)
         (set-quick-add-launched! false))
       (fn []))
     [tab])
    ;; Two-layer structure:
    ;; - Journals layer keeps its own scroll container and is always in the DOM.
    ;; - Page/other-tab layer keeps its own independent scroll container.
    ;; Both are absolutely positioned and stacked; we toggle visibility.
    [:div.w-full.relative
     ;; Journals scroll container (keep-alive)
     [:div#app-main-home.pl-4.pr-3.absolute.inset-0
      {:class (when-not home? "invisible pointer-events-none")}
      (when-not quick-add-launched?
        (home))]
     ;; Other pages: search, settings, specific page, etc.
     (when-not home?
       (other-page view tab route-match))]))

(rum/defc app
  [current-repo route-match]
  (let [[tab] (mobile-state/use-tab)
        [theme] (frum/use-atom-in state/state :ui/theme)]
    (use-screen-size-effects!)
    (use-gesture-navigation!)
    (use-theme-effects! current-repo theme)
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-platform?)
         (bottom-tabs/configure))
       (when-let [element (util/app-scroll-container-node)]
         (common-handler/listen-to-scroll! element)))
     [])
    [:<>
     (mobile-header/header current-repo tab)
     (main-content tab route-match)]))

(defonce hidden-input
  [:input
   {:id mobile-util/mobile-keyboard-anchor-id
    :type "text"}])

(rum/defc main < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)
        show-action-bar? (state/sub :mobile/show-action-bar?)
        {:keys [open? content-fn opts]} (rum/react mobile-state/*popup-data)
        show-popup? (and open? content-fn)
        route-match (state/sub :route-match)]
    [:main#app-container-wrapper.ls-fold-button-on-right
     [:div#app-container {:class (when show-popup? "invisible")}
      [:div#main-container.flex.flex-1.overflow-x-hidden
       (app current-repo route-match)]]
     (when show-popup?
       [:div.ls-layer
        (popup/popup opts content-fn)])
     (editor-toolbar/mobile-bar)
     (when show-action-bar?
       (selection-toolbar/action-bar))
     (shui-popup/install-popups)
     (ui-component/install-notifications)
     (shui-toaster/install-toaster)
     (shui-dialog/install-modals)
     [:div.download
      [:a#download.hidden]
      [:a#download-as-transit-debug.hidden]
      [:a#download-as-sqlite-db.hidden]
      [:a#download-as-zip.hidden]]
     hidden-input]))
