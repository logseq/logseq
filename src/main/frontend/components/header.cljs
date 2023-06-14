(ns frontend.components.header
  (:require [cljs-bean.core :as bean]
            [frontend.components.export :as export]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.plugins :as plugins]
            [frontend.components.server :as server]
            [frontend.components.right-sidebar :as sidebar]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.handler :as handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.components.file-sync :as fs-sync]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.version :refer [version]]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [clojure.string :as string]))

(rum/defc home-button
  < {:key-fn #(identity "home-button")}
  []
  (ui/with-shortcut :go/home "left"
    [:button.button.icon.inline
     {:title (t :home)
      :on-click #(do
                   (when (mobile-util/native-iphone?)
                     (state/set-left-sidebar-open! false))
                   (route-handler/redirect-to-home!))}
     (ui/icon "home" {:size ui/icon-size})]))

(rum/defc login < rum/reactive
  < {:key-fn #(identity "login-button")}
  []
  (let [_ (state/sub :auth/id-token)
        loading? (state/sub [:ui/loading? :login])
        sync-enabled? (file-sync-handler/enable-sync?)
        logged? (user-handler/logged-in?)]
    (when-not (or config/publishing?
                  logged?
                  (not sync-enabled?))
      [:span.flex.space-x-2
       [:a.button.text-sm.font-medium.block
        {:on-click #(state/pub-event! [:user/login])}
        [:span (t :login)]
        (when loading?
          [:span.ml-2 (ui/loading "")])]])))

(rum/defc left-menu-button < rum/reactive
  < {:key-fn #(identity "left-menu-toggle-button")}
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:button.#left-menu.cp__header-left-menu.button.icon
     {:title (t :header/toggle-left-sidebar)
      :on-click on-click}
     (ui/icon "menu-2" {:size ui/icon-size})]))

(def bug-report-url
  (let [ua (.-userAgent js/navigator)
        safe-ua (string/replace ua #"[^_/a-zA-Z0-9\.\(\)]+" " ")
        platform (str "App Version: " version "\n"
                      "Git Revision: " config/REVISION "\n"
                      "Platform: " safe-ua "\n"
                      "Language: " (.-language js/navigator))]
    (str "https://github.com/logseq/logseq/issues/new?"
         "title=&"
         "template=bug_report.yaml&"
         "labels=from:in-app&"
         "platform="
         (js/encodeURIComponent platform))))

(rum/defc dropdown-menu < rum/reactive
  < {:key-fn #(identity "repos-dropdown-menu")}
  [{:keys [current-repo t]}]
  (let [page-menu (page-menu/page-menu nil)
        page-menu-and-hr (when (seq page-menu)
                           (concat page-menu [{:hr true}]))]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:button.button.icon.toolbar-dots-btn
        {:on-click toggle-fn
         :title (t :header/more)}
        (ui/icon "dots" {:size ui/icon-size})])
     (->>
      [(when (state/enable-editing?)
         {:title (t :settings)
          :options {:on-click state/open-settings!}
          :icon (ui/icon "settings")})

       (when config/lsp-enabled?
         {:title (t :plugins)
          :options {:on-click #(plugin-handler/goto-plugins-dashboard!)}
          :icon (ui/icon "apps")})

       (when config/lsp-enabled?
         {:title (t :themes)
          :options {:on-click #(plugins/open-select-theme!)}
          :icon (ui/icon "palette")})

       (when current-repo
         {:title (t :export-graph)
          :options {:on-click #(state/set-modal! export/export)}
          :icon (ui/icon "database-export")})

       (when (and current-repo (state/enable-editing?))
         {:title (t :import)
          :options {:href (rfe/href :import)}
          :icon (ui/icon "file-upload")})

       (when-not config/publishing? 
         {:title [:div.flex-row.flex.justify-between.items-center
                  [:span (t :join-community)]]
          :options {:href "https://discuss.logseq.com"
                    :title (t :discourse-title)
                    :target "_blank"}
          :icon (ui/icon "brand-discord")})

       (when-not config/publishing?
         {:title [:div.flex-row.flex.justify-between.items-center
                  [:span (t :help/bug)]]
          :options {:href (rfe/href :bug-report)}
          :icon (ui/icon "bug")})

       (when config/publishing?
         {:title (t :toggle-theme)
          :options {:on-click #(state/toggle-theme!)}
          :icon (ui/icon "bulb")})

       (when (and (state/sub :auth/id-token) (user-handler/logged-in?))
         {:title (t :logout-user (user-handler/email))
          :options {:on-click #(user-handler/logout)}
          :icon  (ui/icon "logout")})]
      (concat page-menu-and-hr)
      (remove nil?))
     {})))

(rum/defc back-and-forward
  < {:key-fn #(identity "nav-history-buttons")}
  []
  [:div.flex.flex-row

   (ui/with-shortcut :go/backward "bottom"
     [:button.it.navigation.nav-left.button.icon
      {:title (t :header/go-back) :on-click #(js/window.history.back)}
      (ui/icon "arrow-left" {:size ui/icon-size})])

   (ui/with-shortcut :go/forward "bottom"
     [:button.it.navigation.nav-right.button.icon
      {:title (t :header/go-forward) :on-click #(js/window.history.forward)}
      (ui/icon "arrow-right" {:size ui/icon-size})])])

(rum/defc updater-tips-new-version
  [t]
  (let [[downloaded, set-downloaded] (rum/use-state nil)
        _ (rum/use-effect!
           (fn []
             (when-let [channel (and (util/electron?) "auto-updater-downloaded")]
               (let [callback (fn [_ args]
                                (js/console.debug "[new-version downloaded] args:" args)
                                (let [args (bean/->clj args)]
                                  (set-downloaded args)
                                  (state/set-state! :electron/auto-updater-downloaded args))
                                nil)]
                 (js/apis.addListener channel callback)
                 #(js/apis.removeListener channel callback))))
           [])]

    (when downloaded
      [:div.cp__header-tips
       [:p (t :updater/new-version-install)
        [:a.restart.ml-2
         {:on-click #(handler/quit-and-install-new-version!)}
         (svg/reload 16) [:strong (t :updater/quit-and-install)]]]])))

(rum/defc ^:large-vars/cleanup-todo header < rum/reactive
  [{:keys [open-fn current-repo default-home new-block-mode]}]
  (let [repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))
        _ (state/sub [:user/info :UserGroups])
        electron-mac? (and util/mac? (util/electron?))
        show-open-folder? (and (nfs/supported?)
                               (or (empty? repos)
                                   (nil? (state/sub :git/current-repo)))
                               (not (mobile-util/native-platform?))
                               (not config/publishing?))
        left-menu (left-menu-button {:on-click (fn []
                                                 (open-fn)
                                                 (state/set-left-sidebar-open!
                                                  (not (:ui/left-sidebar-open? @state/state))))})
        custom-home-page? (and (state/custom-home-page?)
                               (= (state/sub-default-home-page) (state/get-current-page)))
        sync-enabled? (file-sync-handler/enable-sync?)]
    [:div.cp__header.drag-region#head
     {:class           (util/classnames [{:electron-mac   electron-mac?
                                          :native-ios     (mobile-util/native-ios?)
                                          :native-android (mobile-util/native-android?)}])
      :on-double-click (fn [^js e]
                         (when-let [target (.-target e)]
                           (cond
                             (and (util/electron?)
                                  (.. target -classList (contains "drag-region")))
                             (js/window.apis.toggleMaxOrMinActiveWindow)

                             (mobile-util/native-platform?)
                             (util/scroll-to-top true))))
      :style           {:fontSize 50}}
     [:div.l.flex.drag-region
      [left-menu
       (if (mobile-util/native-platform?)
         ;; back button for mobile
         (when-not (or (state/home?) custom-home-page? (state/whiteboard-dashboard?))
           (ui/with-shortcut :go/backward "bottom"
             [:button.it.navigation.nav-left.button.icon.opacity-70
              {:title (t :header/go-back) :on-click #(js/window.history.back)}
              (ui/icon "chevron-left" {:size 26})]))
         ;; search button for non-mobile
         (when current-repo
           (ui/with-shortcut :go/search "right"
             [:button.button.icon#search-button
              {:title (t :header/search)
               :on-click #(do (when (or (mobile-util/native-android?)
                                        (mobile-util/native-iphone?))
                                (state/set-left-sidebar-open! false))
                              (state/pub-event! [:go/search]))}
              (ui/icon "search" {:size ui/icon-size})])))]]

     [:div.r.flex.drag-region
      (when (and current-repo
                 (not (config/demo-graph? current-repo))
                 (user-handler/alpha-or-beta-user?))
        (fs-sync/indicator))

      (when (and (not= (state/get-current-route) :home)
                 (not custom-home-page?))
        (home-button))

      (when sync-enabled?
        (login))

      (when config/lsp-enabled?
        [:<>
         (plugins/hook-ui-items :toolbar)
         (plugins/updates-notifications)])

      (when (state/feature-http-server-enabled?)
        (server/server-indicator (state/sub :electron/server)))

      (when (util/electron?)
        (back-and-forward))

      (when-not (mobile-util/native-platform?)
        (new-block-mode))

      (when show-open-folder?
        [:a.text-sm.font-medium.button.icon.add-graph-btn.flex.items-center
         {:on-click #(route-handler/redirect! {:to :repo-add})}
         (ui/icon "folder-plus")
         (when-not config/mobile?
           [:span.ml-1 {:style {:margin-top (if electron-mac? 0 2)}}
            (t :on-boarding/add-graph)])])

      (when config/publishing?
        [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
         (t :graph)])

      (dropdown-menu {:t            t
                      :current-repo current-repo
                      :default-home default-home})

      (sidebar/toggle)

      (updater-tips-new-version t)]]))
