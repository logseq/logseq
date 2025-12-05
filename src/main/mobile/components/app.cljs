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
            [mobile.components.search :as search]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.components.ui :as ui-component]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc journals
  []
  (ui-component/classic-app-container-wrap
   [:div.pt-6
    (journal/all-journals)]))

(rum/defc home-inner < rum/static
  [db-restoring?]
  (if db-restoring?
    [:div.space-y-2.mt-8.mx-0.opacity-75
     (shui/skeleton {:class "h-10 w-full mb-6"})
     (shui/skeleton {:class "h-6 w-full"})
     (shui/skeleton {:class "h-6 w-full"})]
    (journals)))

(rum/defc home < rum/reactive rum/static
  {:did-mount (fn [state]
                (ui/inject-document-devices-envs!)
                state)}
  []
  (let [db-restoring? (state/sub :db/restoring?)]
    (home-inner db-restoring?)))

(defn use-theme-effects!
  [current-repo theme]
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
        (do (.add cls "dark")
            (doto cls-body (.remove "light-theme") (.add "dark-theme")))
        (do (.remove cls "dark")
            (doto cls-body (.remove "dark-theme") (.add "light-theme")))))
   [theme])

  (hooks/use-effect!
   (fn []
     (some-> js/window.externalsjs (.settleStatusBar)))
   [current-repo]))

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
                 ;; (editor-handler/quick-add-open-last-block!)
                 )
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
         (= tab "search") (search/search)
         (= tab "capture") (capture)))]))

(rum/defc main-content < rum/static
  [tab route-match]
  (let [view (get-in route-match [:data :view])
        home? (and (= tab "home") (nil? view))]
    ;; Two-layer structure:
    ;; - Journals layer keeps its own scroll container and is always in the DOM.
    ;; - Page/other-tab layer keeps its own independent scroll container.
    ;; Both are absolutely positioned and stacked; we toggle visibility.
    [:div.h-full.relative
     ;; Journals scroll container (keep-alive)
     [:div#app-main-home.pl-3.pr-2.absolute.inset-0
      {:class (when-not home? "invisible pointer-events-none")}
      (home)]

     ;; Other pages: search, settings, specific page, etc.
     (when-not home?
       (other-page view tab route-match))]))

(rum/defc app
  [current-repo route-match]
  (let [[tab] (mobile-state/use-tab)
        [theme] (frum/use-atom-in state/state :ui/theme)]
    (use-screen-size-effects!)
    (use-theme-effects! current-repo theme)
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (bottom-tabs/configure))
       (when-let [element (util/app-scroll-container-node)]
         (common-handler/listen-to-scroll! element)))
     [])
    [:div.h-full {:class (if (contains? #{"search"} tab)
                           "mt-20"
                           "mt-24")}
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
        fold-button-on-right? (state/enable-fold-button-right?)
        route-match (state/sub :route-match)]
    [:main.w-full.h-full
     {:class (util/classnames
              [{:ls-fold-button-on-right fold-button-on-right?}])}
     [:div.w-full.h-full {:class (when show-popup? "invisible")}
      (app current-repo route-match)]
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
