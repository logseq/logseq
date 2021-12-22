(ns frontend.components.header
  (:require [frontend.components.export :as export]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.page :as page]
            [clojure.string :as str]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.right-sidebar :as sidebar]
            [frontend.components.search :as search]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.handler :as handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]
            [frontend.components.widgets :as widgets]
            [frontend.handler.web.nfs :as nfs-handler]))

(rum/defc home-button []
  (ui/with-shortcut :go/home "left"
    [:a.button
     {:href     (rfe/href :home)
      :on-click route-handler/go-to-journals!}
     (ui/icon "home" {:style {:fontSize ui/icon-size}})]))

(rum/defc login
  [logged?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (when (and (not logged?)
               (not config/publishing?))

      (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:a.button.text-sm.font-medium.block {:on-click toggle-fn}
          [:span (t :login)]])
       (let [list [;; {:title (t :login-google)
                   ;;  :url (str config/website "/login/google")}
                   {:title (t :login-github)
                    :url (str config/website "/login/github")}]]
         (mapv
          (fn [{:keys [title url]}]
            {:title title
             :options
             {:on-click
              (fn [_] (set! (.-href js/window.location) url))}})
          list))
       nil))))

(rum/defc left-menu-button < rum/reactive
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:a#left-menu.cp__header-left-menu.button
     {:on-click on-click
      :style {:margin-left 12}}
     (ui/icon "menu-2" {:style {:fontSize ui/icon-size}})]))

(rum/defc dropdown-menu < rum/reactive
  [{:keys [me current-repo t default-home]}]
  (let [projects (state/sub [:me :projects])
        developer-mode? (state/sub [:ui/developer-mode?])
        logged? (state/logged?)
        page-menu (page-menu/page-menu nil)
        page-menu-and-hr (when (seq page-menu)
                           (concat page-menu [{:hr true}]))]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:a.button
        {:on-click toggle-fn}
        (ui/icon "dots" {:style {:fontSize ui/icon-size}})])
     (->>
      [(when-not (state/publishing-enable-editing?)
         {:title (t :settings)
          :options {:on-click state/open-settings!}
          :icon svg/settings-sm})

       (when (and developer-mode? (util/electron?))
         {:title (t :plugins)
          :options {:href (rfe/href :plugins)}})

       (when developer-mode?
         {:title (t :themes)
          :options {:on-click #(plugins/open-select-theme!)}})

       (when current-repo
         {:title (t :export-graph)
          :options {:on-click #(state/set-modal! export/export)}
          :icon nil})

       (when current-repo
         {:title (t :import)
          :options {:href (rfe/href :import)}
          :icon svg/import-sm})

       {:title [:div.flex-row.flex.justify-between.items-center
                [:span (t :join-community)]]
        :options {:href "https://discord.gg/KpN4eHY"
                  :title (t :discord-title)
                  :target "_blank"}
        :icon svg/discord}
       (when logged?
         {:title (t :sign-out)
          :options {:on-click user-handler/sign-out!}
          :icon svg/logout-sm})]
      (concat page-menu-and-hr)
      (remove nil?))
     {}
     ;; {:links-footer (when (and (util/electron?) (not logged?))
     ;;                  [:div.px-2.py-2 (login logged?)])}
     )))

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

(rum/defc header < rum/reactive
  [{:keys [open-fn current-repo logged? me default-home new-block-mode]}]
  (let [repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))
        electron-mac? (and util/mac? (util/electron?))
        vw-state (state/sub :ui/visual-viewport-state)
        show-open-folder? (and (or (nfs/supported?)
                                   (mobile-util/is-native-platform?))
                               (empty? repos)
                               (not config/publishing?))
        refreshing? (state/sub :nfs/refreshing?)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__header#head
       {:class           (util/classnames [{:electron-mac   electron-mac?
                                            :native-ios     (mobile-util/native-ios?)
                                            :native-android (mobile-util/native-android?)}])
        :on-double-click (fn [^js e]
                           (when-let [target (.-target e)]
                             (when (and (util/electron?)
                                        (or (.. target -classList (contains "cp__header"))))
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
        (when (and (not (mobile-util/is-native-platform?))
                   (not (util/electron?)))
          (login logged?))
        
        (when plugin-handler/lsp-enabled?
          (plugins/hook-ui-items :toolbar))

        (when (not= (state/get-current-route) :home)
          (home-button))
        
        (when (or (util/electron?)
                  (mobile-util/native-ios?))
          (back-and-forward))

        (new-block-mode)

        (when (mobile-util/is-native-platform?)
          [:a.text-sm.font-medium.button
           {:on-click
            (fn []
              (state/pub-event!
               [:modal/show
                [:div {:style {:max-width 700}}
                 [:p "Refresh detects and processes files modified on your disk and diverged from the actual Logseq page content. Continue?"]
                 (ui/button
                  "Yes"
                  :on-click (fn []
                              (state/close-modal!)
                              (nfs-handler/refresh! (state/get-current-repo) repo/refresh-cb)))]]))}
           (if refreshing?
             [:div {:class "animate-spin-reverse"}
              svg/refresh]
             (when (seq repos)
               [:div.flex.flex-row.text-center.open-button__inner.items-center
                (ui/icon "refresh" {:style {:fontSize ui/icon-size}})]))])

        (repo/sync-status current-repo)

        (when (and
               show-open-folder?
               (not (mobile-util/is-native-platform?)))
          [:a.text-sm.font-medium.button
           {:on-click #(page-handler/ls-dir-files! shortcut/refresh!)}
           [:div.flex.flex-row.text-center.open-button__inner.items-center
            (ui/icon "folder-plus")
            (when-not config/mobile?
              [:span.ml-1 {:style {:margin-top (if electron-mac? 0 2)}}
               (t :open)])]])

        (when config/publishing?
          [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
           (t :graph)])

        (dropdown-menu {:me           me
                        :t            t
                        :current-repo current-repo
                        :default-home default-home})

        (when (not (state/sub :ui/sidebar-open?))
          (sidebar/toggle))

        (updater-tips-new-version t)]])))
