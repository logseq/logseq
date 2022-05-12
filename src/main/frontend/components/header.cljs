(ns frontend.components.header
  (:require ["path" :as path]
            [cljs-bean.core :as bean]
            [frontend.components.export :as export]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.plugins :as plugins]
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
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc home-button []
  (ui/with-shortcut :go/home "left"
    [:a.button
     {:href     (rfe/href :home)
      :on-click #(do
                   (when (mobile-util/native-iphone?)
                     (state/set-left-sidebar-open! false))
                   (route-handler/go-to-journals!))}
     (ui/icon "home" {:style {:fontSize ui/icon-size}})]))

(rum/defc login < rum/reactive
  []
  (let [_ (state/sub :auth/id-token)]
    (when-not config/publishing?
      (if (user-handler/logged-in?)
        (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           [:a.button
            {:on-click toggle-fn}
            [:span.text-sm.font-medium (user-handler/email)]])
         [{:title (t :logout)
           :options {:on-click user-handler/logout}}]
         {})
        [:a.button.text-sm.font-medium.block {:on-click #(js/window.open config/LOGIN-URL)}
         [:span (t :login)]]))))

(rum/defc left-menu-button < rum/reactive
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:a#left-menu.cp__header-left-menu.button
     {:on-click on-click
      :style {:margin-left 12}}
     (ui/icon "menu-2" {:style {:fontSize ui/icon-size}})]))

(rum/defc dropdown-menu < rum/reactive
  [{:keys [current-repo t]}]
  (let [page-menu (page-menu/page-menu nil)
        page-menu-and-hr (when (seq page-menu)
                           (concat page-menu [{:hr true}]))]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:a.button
        {:on-click toggle-fn}
        (ui/icon "dots" {:style {:fontSize ui/icon-size}})])
     (->>
      [(when (state/enable-editing?)
         {:title (t :settings)
          :options {:on-click state/open-settings!}
          :icon (ui/icon "settings")})

       (when plugin-handler/lsp-enabled?
         {:title (t :plugins)
          :options {:on-click #(plugin-handler/goto-plugins-dashboard!)}
          :icon (ui/icon "apps")})

       (when plugin-handler/lsp-enabled?
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

       {:title [:div.flex-row.flex.justify-between.items-center
                [:span (t :join-community)]]
        :options {:href "https://discord.gg/KpN4eHY"
                  :title (t :discord-title)
                  :target "_blank"}
        :icon (ui/icon "brand-discord")}]
      (concat page-menu-and-hr)
      (remove nil?))
     {})))

(rum/defc back-and-forward
  []
  [:div.flex.flex-row

   (ui/with-shortcut :go/backward "bottom"
     [:a.it.navigation.nav-left.button
      {:title "Go back" :on-click #(js/window.history.back)}
      (ui/icon "arrow-left" {:style {:fontSize ui/icon-size}})])

   (ui/with-shortcut :go/forward "bottom"
     [:a.it.navigation.nav-right.button
      {:title "Go forward" :on-click #(js/window.history.forward)}
      (ui/icon "arrow-right" {:style {:fontSize ui/icon-size}})])])

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
        electron-mac? (and util/mac? (util/electron?))
        vw-state (state/sub :ui/visual-viewport-state)
        show-open-folder? (and (nfs/supported?)
                               (or (empty? repos)
                                   (nil? (state/sub :git/current-repo)))
                               (not (mobile-util/is-native-platform?))
                               (not config/publishing?))]
    [:div.cp__header#head
     {:class           (util/classnames [{:electron-mac   electron-mac?
                                          :native-ios     (mobile-util/native-ios?)
                                          :native-android (mobile-util/native-android?)}])
      :on-double-click (fn [^js e]
                         (when-let [target (.-target e)]
                           (when (and (util/electron?)
                                      (.. target -classList (contains "cp__header")))
                             (js/window.apis.toggleMaxOrMinActiveWindow))))
      :style           {:fontSize  50
                        :transform (str "translateY(" (or (:offset-top vw-state) 0) "px)")}}
     [:div.l.flex
      (left-menu-button {:on-click (fn []
                                     (open-fn)
                                     (state/set-left-sidebar-open!
                                      (not (:ui/left-sidebar-open? @state/state))))})

      (when current-repo ;; this is for the Search button
        (ui/with-shortcut :go/search "right"
          [:a.button#search-button
           {:on-click #(do (when (or (mobile-util/native-android?)
                                     (mobile-util/native-iphone?))
                             (state/set-left-sidebar-open! false))
                           (state/pub-event! [:go/search]))}
           (ui/icon "search" {:style {:fontSize ui/icon-size}})]))]

     [:div.r.flex
      (when-not file-sync-handler/hiding-login&file-sync
        (fs-sync/indicator))
      (when-not file-sync-handler/hiding-login&file-sync
        (login))

      (when plugin-handler/lsp-enabled?
        (plugins/hook-ui-items :toolbar))

      (when (not= (state/get-current-route) :home)
        (home-button))

      (when (or (util/electron?)
                (mobile-util/native-ios?))
        (back-and-forward))

      (when-not (mobile-util/is-native-platform?)
        (new-block-mode))

      (when show-open-folder?
        [:a.text-sm.font-medium.button.add-graph-btn.flex.items-center
         {:on-click #(route-handler/redirect! {:to :repo-add})}
         (ui/icon "folder-plus")
         (when-not config/mobile?
           [:strong {:style {:margin-top (if electron-mac? 0 2)}}
            (t :on-boarding/add-graph)])])

      (when config/publishing?
        [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
         (t :graph)])

      (dropdown-menu {:t            t
                      :current-repo current-repo
                      :default-home default-home})

      (when (not (state/sub :ui/sidebar-open?))
        (sidebar/toggle))

      (updater-tips-new-version t)]]))
