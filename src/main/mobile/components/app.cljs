(ns mobile.components.app
  "App root"
  (:require ["../externals.js"]
            [frontend.components.journal :as journal]
            [frontend.handler.common :as common-handler]
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
            [mobile.components.header :as mobile-header]
            [mobile.components.popup :as popup]
            [mobile.components.search :as search]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.components.settings :as settings]
            [mobile.components.ui :as ui-component]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc journals
  []
  (ui-component/classic-app-container-wrap
   [:div.pt-3
    (journal/all-journals)]))

(rum/defc home-inner < rum/static
  [db-restoring?]
  (if db-restoring?
    [:div.space-y-2.mt-8.mx-0.opacity-75
     (shui/skeleton {:class "h-10 w-full mb-6 bg-gray-200"})
     (shui/skeleton {:class "h-6 w-full bg-gray-200"})
     (shui/skeleton {:class "h-6 w-full bg-gray-200"})]
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

(rum/defc other-page
  [view tab route-match]
  [:div#main-content-container.px-5.ls-layer
   (if view
     (view route-match)
     (case (keyword tab)
       :home nil
       :favorites (favorites/favorites)
       :settings (settings/page)
       :search (search/search)
       nil))])

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
     [:div#app-main-home.px-5.absolute.inset-0.overflow-y-auto
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
     (ui-component/keep-keyboard-virtual-input)
     (ui-component/install-notifications)
     (shui-toaster/install-toaster)
     (shui-dialog/install-modals)]))
