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
            [frontend.fs.sync :as fs-sync]
            [frontend.handler :as handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [cljs.core.async :as a]))

(rum/defc home-button []
  (ui/with-shortcut :go/home "left"
    [:button.button.icon.inline
     {:title "Home"
      :on-click #(do
                   (when (mobile-util/native-iphone?)
                     (state/set-left-sidebar-open! false))
                   (route-handler/redirect-to-home!))}
     (ui/icon "home" {:style {:fontSize ui/icon-size}})]))

(rum/defc login < rum/reactive
  []
  (let [_ (state/sub :auth/id-token)]
    (when-not config/publishing?
      (if (user-handler/logged-in?)
        (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           [:button.button
            {:on-click toggle-fn}
            [:span.text-sm.font-medium (user-handler/email)]])
         [{:title (t :logout)
           :options {:on-click user-handler/logout}}]
         {})
        [:button.button.text-sm.font-medium.block {:on-click #(js/window.open config/LOGIN-URL)}
         [:span (t :login)]]))))

(rum/defcs file-sync-remote-graphs <
  (rum/local nil ::remote-graphs)
  [state]
  (let [*remote-graphs (::remote-graphs state)
        refresh-list-fn #(a/go (reset! *remote-graphs (a/<! (file-sync-handler/list-graphs))))]
    (when (nil? @*remote-graphs)
      (refresh-list-fn))
    [:div
     [:div.flex
      [:h1.title "Remote Graphs"]
      [:div
       {:on-click refresh-list-fn}
       svg/refresh]]
     [:p.text-sm "click to delete the selected graph"]
     [:ul
      (for [graph @*remote-graphs]
        [:li.mb-4
         [:a.font-medium
          {:on-click #(do (println "delete graph" (:GraphName graph) (:GraphUUID graph))
                          (file-sync-handler/delete-graph (:GraphUUID graph)))}
          (:GraphName graph)]])]]))

(rum/defcs file-sync <
  rum/reactive
  (rum/local nil ::existed-graphs)
  [state]
  (let [_ (state/sub :auth/id-token)
        sync-state (state/sub :file-sync/sync-state)
        not-syncing? (or (nil? sync-state) (fs-sync/sync-state--stopped? sync-state))
        *existed-graphs (::existed-graphs state)
        _ (rum/react file-sync-handler/refresh-file-sync-component)
        graph-txid-exists? (file-sync-handler/graph-txid-exists?)
        uploading-files (:current-local->remote-files sync-state)
        downloading-files (:current-remote->local-files sync-state)]
    (when-not config/publishing?
      (when (user-handler/logged-in?)
        (when-not (file-sync-handler/graph-txid-exists?)
          (a/go (reset! *existed-graphs (a/<! (file-sync-handler/list-graphs)))))
        (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           (if not-syncing?
             [:button.button.icon.inline
              {:on-click toggle-fn}
              (ui/icon "cloud-off" {:style {:fontSize ui/icon-size}})]
             [:button.button.icon.inline
              {:on-click toggle-fn}
              (ui/icon "cloud" {:style {:fontSize ui/icon-size}})]))
         (cond-> []
           (not graph-txid-exists?)
           (concat (->> @*existed-graphs
                        (filterv #(and (:GraphName %) (:GraphUUID %)))
                        (mapv (fn [graph]
                                {:title (:GraphName graph)
                                 :options {:on-click #(file-sync-handler/switch-graph (:GraphUUID graph))}})))
                   [{:hr true}
                    {:title "create graph"
                     :options {:on-click #(file-sync-handler/create-graph (path/basename (state/get-current-repo)))}}])
           graph-txid-exists?
           (concat
            [{:title "toggle file sync"
              :options {:on-click #(if not-syncing? (fs-sync/sync-start) (fs-sync/sync-stop))}}
             {:title "remote graph list"
              :options {:on-click #(state/set-sub-modal! file-sync-remote-graphs)}}]
            [{:hr true}]
            (map (fn [f] {:title f
                          :icon (ui/icon "arrow-narrow-up")}) uploading-files)
            (map (fn [f] {:title f
                          :icon (ui/icon "arrow-narrow-down")}) downloading-files)
            (when sync-state
              (map-indexed (fn [i f] (:time f)
                     {:title [:div {:key i} [:div (:path f)] [:div.opacity-50 (util/time-ago (:time f))]]})
                   (take 10 (:history sync-state))))))

         (cond-> {}
           (not graph-txid-exists?) (assoc :links-header [:div.font-medium.text-sm.opacity-60.px-4.pt-2
                                                          "Switch to:"])))))))



(rum/defc left-menu-button < rum/reactive
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:button.#left-menu.cp__header-left-menu.button.icon
     {:title "Toggle left menu"
      :on-click on-click}
      (ui/icon "menu-2" {:style {:fontSize ui/icon-size}})]))

(rum/defc dropdown-menu < rum/reactive
  [{:keys [current-repo t]}]
  (let [page-menu (page-menu/page-menu nil)
        page-menu-and-hr (when (seq page-menu)
                           (concat page-menu [{:hr true}]))]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:button.button.icon
        {:title "More"
         :on-click toggle-fn}
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
        :options {:href "https://discuss.logseq.com"
                  :title (t :discourse-title)
                  :target "_blank"}
        :icon (ui/icon "message-circle")}]
      (concat page-menu-and-hr)
      (remove nil?))
     {})))

(rum/defc back-and-forward
  []
  [:div.flex.flex-row

   (ui/with-shortcut :go/backward "bottom"
     [:button.it.navigation.nav-left.button.icon
      {:title "Go back" :on-click #(js/window.history.back)}
      (ui/icon "arrow-left" {:style {:fontSize ui/icon-size}})])

   (ui/with-shortcut :go/forward "bottom"
     [:button.it.navigation.nav-right.button.icon
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
                               (= (state/sub-default-home-page) (state/get-current-page)))]
    [:div.cp__header#head
     {:class           (util/classnames [{:electron-mac   electron-mac?
                                          :native-ios     (mobile-util/native-ios?)
                                          :native-android (mobile-util/native-android?)}])
      :on-double-click (fn [^js e]
                         (when-let [target (.-target e)]
                           (when (and (util/electron?)
                                      (.. target -classList (contains "cp__header")))
                             (js/window.apis.toggleMaxOrMinActiveWindow))))
      :style           {:fontSize  50}}
     [:div.l.flex
      (when-not (mobile-util/native-platform?)
        [left-menu
         (when current-repo ;; this is for the Search button
           (ui/with-shortcut :go/search "right"
             [:button.button.icon#search-button
              {:title "Search"
               :on-click #(do (when (or (mobile-util/native-android?)
                                        (mobile-util/native-iphone?))
                                (state/set-left-sidebar-open! false))
                              (state/pub-event! [:go/search]))}
              (ui/icon "search" {:style {:fontSize ui/icon-size}})]))])
      (when (mobile-util/native-platform?)
        (if (or (state/home?) custom-home-page?)
          left-menu
          (ui/with-shortcut :go/backward "bottom"
            [:button.it.navigation.nav-left.button.icon
             {:title "Go back" :on-click #(js/window.history.back)}
             (ui/icon "chevron-left" {:style {:fontSize 25}})])))]

     [:div.r.flex
      (when-not file-sync-handler/hiding-login&file-sync
        (file-sync))
      (when-not file-sync-handler/hiding-login&file-sync
        (login))
      (when plugin-handler/lsp-enabled?
        (plugins/hook-ui-items :toolbar))

      (when (and (not= (state/get-current-route) :home)
                 (not custom-home-page?))
        (home-button))

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
        [:button.text-sm.font-medium.button {:href (rfe/href :graph)}
         (t :graph)])

      (dropdown-menu {:t            t
                      :current-repo current-repo
                      :default-home default-home})

      (when (not (state/sub :ui/sidebar-open?))
        (sidebar/toggle))

      (updater-tips-new-version t)]]))
