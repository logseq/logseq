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
            [mobile.components.ui-silk :as ui-silk]
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

(rum/defc main-content-inner < rum/static
  [tab route-match]
  (let [view (get-in route-match [:data :view])
        ;; We are on the journals home screen if the tab is :home
        ;; AND there is no view (e.g. not viewing a specific journal page)
        home? (and (= tab "home") (nil? view))]
    ;; Two-layer structure:
    ;; - Journals layer keeps its own scroll container and is always in the DOM.
    ;; - Page layer keeps its own independent scroll container.
    ;; This ensures switching tabs does not reset scrollTop.
    [:div#main-container
     ;; Journals scroll container (keep-alive)
     ;; This element stays mounted permanently and only toggles visibility.
     [:div#app-main-home {:class (when-not home? "hidden")}
      [:div.px-5
       (home)]]

     ;; Other pages: page, search, settings, etc.
     ;; These views scroll independently from the journals layer.
     (when-not home?
       [:div#main-content-container.px-5
        (if view
          (view route-match)
          (case (keyword tab)
            :home
            nil

            :favorites
            (favorites/favorites)

            :settings
            (settings/page)

            :search
            (search/search)

            nil))])]))

(rum/defc main-content < rum/reactive
  [tab]
  (let [route-match (state/sub :route-match)]
    (main-content-inner tab route-match)))

(rum/defc app
  [current-repo {:keys [login?]}]
  (let [[tab] (mobile-state/use-tab)]
    (use-screen-size-effects!)
    (use-theme-effects! current-repo)
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (bottom-tabs/configure))
       (when-let [element (util/app-scroll-container-node)]
         (common-handler/listen-to-scroll! element))) [])
    [:div.mt-24.h-full
     (mobile-header/header tab)
     (main-content tab)
     ;; bottom tabs
     (when-not (mobile-util/native-ios?)
       (ui-silk/app-silk-tabs))

     (ui-component/keep-keyboard-virtual-input)
     (ui-component/install-notifications)

     (shui-toaster/install-toaster)
     (shui-dialog/install-modals)
     (shui-popup/install-popups)
     (popup/popup)]))

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
