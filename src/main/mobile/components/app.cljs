(ns mobile.components.app
  "App root"
  (:require ["../externals.js"]
            [frontend.config :as config]
            [frontend.components.journal :as journal]
            [frontend.components.quick-add :as quick-add]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.handler.common :as common-handler]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
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

(defn- safe-locale-date
  [timestamp]
  (when (number? timestamp)
    (try
      (i18n/locale-format-date (js/Date. timestamp))
      (catch js/Error _e nil))))

(defn- native-graph-action
  [id title destructive? message]
  {:id id
   :title title
   :destructive destructive?
   :confirmTitle title
   :confirmMessage message
   :confirmButton (t :ui/confirm)
   :cancelButton (t :ui/cancel)})

(defn- native-graph-actions
  [{:keys [url root remote? GraphUUID GraphSchemaVersion]}]
  (let [graph-name (config/db-graph-name url)
        warning (t :graph/delete-warning)
        delete-message (fn [message] (str message "\n\n" warning))]
    (cond-> []
      root
      (conj
       (native-graph-action
        "deleteLocal"
        (t :graph/delete-local-action)
        true
        (delete-message (t :graph/delete-local-confirm-desc graph-name))))

      (and remote?
           GraphUUID
           GraphSchemaVersion
           (user-handler/manager? url))
      (conj
       (native-graph-action
        "deleteRemote"
        (t :graph/delete-server-action)
        true
        (delete-message (t :graph/delete-server-confirm-desc graph-name))))

      (and remote?
           GraphUUID
           (not (user-handler/manager? url)))
      (conj
       (native-graph-action
        "leaveRemote"
        (t :graph/leave-action)
        true
        (t :graph/leave-confirm-desc))))))

(defn- native-graph-item
  [downloading-graph-id {:keys [url root remote? graph-e2ee?
                                GraphName GraphSchemaVersion GraphUUID
                                graph-ready-for-use? created-at last-seen-at]
                         :as graph}]
  (let [display-name (text-util/get-graph-name-from-path url)
        time (safe-locale-date (or last-seen-at created-at))
        downloading? (and downloading-graph-id (= GraphUUID downloading-graph-id))]
    (when (seq display-name)
      {:id (or GraphUUID url)
       :url url
       :displayName display-name
       :subtitle (when time (t :graph/last-opened-at-label time))
       :remote (boolean remote?)
       :local (boolean root)
       :readyForUse (not= false graph-ready-for-use?)
       :downloading (boolean downloading?)
       :e2ee (boolean graph-e2ee?)
       :graphName GraphName
       :graphUUID GraphUUID
       :graphSchemaVersion GraphSchemaVersion
       :actions (native-graph-actions graph)})))

(defn- native-graph-sections
  [repos remotes login? downloading-graph-id]
  (let [repos (util/distinct-by :url repos)
        repos (->> (if (and login? (seq remotes))
                     (repo-handler/combine-local-&-remote-graphs repos remotes)
                     repos)
                   (util/distinct-by :url))
        repos (cond->>
               (remove #(= (:url %) config/demo-repo) repos)
                true
                (filter (fn [item]
                          (config/db-based-graph? (:url item)))))
        {remote-graphs true local-graphs false} (group-by (comp boolean :remote?) repos)
        {own-graphs true shared-graphs false}
        (group-by (fn [graph] (= "manager" (:graph<->user-user-type graph))) remote-graphs)
        section (fn [id title refreshable? show-empty? graphs]
                  (let [items (vec (keep #(native-graph-item downloading-graph-id %) graphs))]
                    (when (or show-empty? (seq items))
                      {:id id
                       :title title
                       :refreshable refreshable?
                       :graphs items})))]
    (vec
     (keep identity
           [(section "local" (t :graph/local-graphs) false true local-graphs)
            (section "remote" (t :graph/remote-graphs) true false own-graphs)
            (section "shared" (t :graph/shared-graphs) false false shared-graphs)]))))

(defn- use-native-graphs-effects!
  []
  (let [[id-token] (frum/use-atom-in state/state :auth/id-token)
        [repos] (frum/use-atom-in state/state [:me :repos])
        [remotes] (frum/use-atom-in state/state :rtc/graphs)
        [downloading-graph-id] (frum/use-atom-in state/state :rtc/downloading-graph-uuid)
        [loading-graphs?] (frum/use-atom-in state/state :rtc/loading-graphs?)
        [route-match] (frum/use-atom-in state/state :route-match)
        [_preferred-language] (frum/use-atom-in state/state :preferred-language)
        [tab] (frum/use-atom mobile-state/*tab)
        login? (boolean id-token)
        route-name (get-in route-match [:data :name])
        visible? (and (= tab "graphs")
                      (not (contains? #{:import :export} route-name)))
        sections (native-graph-sections repos remotes login? downloading-graph-id)
        labels {:refresh (t :ui/refresh)
                :preparing (t :graph/preparing)
                :downloading (t :graph/downloading)}]
    (hooks/use-effect!
     (fn []
       (when (and (mobile-util/native-ios?)
                  login?
                  (user-handler/rtc-group?))
         (rtc-handler/<get-remote-graphs))
       nil)
     [login?])
    (hooks/use-effect!
     (fn []
       (bottom-tabs/update-native-graphs! {:labels labels
                                           :sections sections
                                           :visible visible?
                                           :refreshing (boolean loading-graphs?)})
       nil)
     [labels sections visible? loading-graphs?])))

(rum/defc native-graphs-bridge
  []
  (use-native-graphs-effects!)
  [:<>])

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

(rum/defc flashcards <
  {:did-mount (fn [state]
                (fsrs/update-due-cards-count)
                state)}
  []
  [:div.ls-mobile-flashcards
   (fsrs/cards-view nil {:mobile? true
                         :on-header-change mobile-state/set-flashcards-header!
                         :on-selector-change mobile-state/set-flashcards-selector!})])

(rum/defc other-page < rum/static
  [route-view tab route-match]
  (let [page-view? (= (get-in route-match [:data :name]) :page)]
    [:div#main-content-container.pl-3.ls-layer
     {:class (if page-view? "pr-2" "pr-3")}
     (if route-view
       (route-view route-match)
       ;; NOTE: `case` caused IllegalArgumentException: Duplicate case test constant
       (cond
         (= tab "graphs") (when-not (mobile-util/native-ios?)
                            (graphs/page))
         (= tab "go to") (favorites/favorites)
         (= tab "search") nil
         (= tab "flashcards") (component-with-restoring (flashcards))
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
        preferred-language (state/sub :preferred-language)
        [theme] (frum/use-atom-in state/state :ui/theme)]
    (use-screen-size-effects!)
    (use-theme-effects! current-repo theme)
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (.requestAnimationFrame
          js/window
          (fn []
            (.requestAnimationFrame
             js/window
             (fn []
               (bottom-tabs/mark-tab-content-ready! tab))))))
       nil)
     [tab route-match])
    (hooks/use-effect!
     (fn []
       (when-let [element (util/app-scroll-container-node)]
         (common-handler/listen-to-scroll! element)))
     [])
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-platform?)
         (bottom-tabs/configure)))
     [preferred-language])
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
     (when (mobile-util/native-ios?)
       (native-graphs-bridge))
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
