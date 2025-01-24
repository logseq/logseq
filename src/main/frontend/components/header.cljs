(ns frontend.components.header
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.components.export :as export]
            [frontend.components.file-sync :as fs-sync]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.plugins :as plugins]
            [frontend.components.right-sidebar :as sidebar]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.components.server :as server]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler :as handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.hooks :as hooks]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.version :refer [version]]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [logseq.shui.util :as shui-util]
            [missionary.core :as m]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc home-button
  < {:key-fn #(identity "home-button")}
  []
  (shui/button-ghost-icon :home
                          {:title (t :home)
                           :on-click #(do
                                        (when (mobile-util/native-iphone?)
                                          (state/set-left-sidebar-open! false))
                                        (route-handler/redirect-to-home!))}))

(rum/defcs rtc-collaborators <
  rum/reactive
  (rum/local nil ::online-users)
  (rum/local nil ::online-users-canceler)
  {:will-mount (fn [state]
                 (reset!
                  (::online-users-canceler state)
                  (c.m/run-task
                   (m/reduce (fn [_ v] (reset! (::online-users state) v)) rtc-flows/rtc-online-users-flow)
                   :fetch-online-users :succ (constantly nil)))
                 state)
   :will-unmount (fn [state]
                   (when @(::online-users-canceler state) (@(::online-users-canceler state)))
                   (reset! (::online-users state) nil)
                   state)}
  [state]
  (let [rtc-graph-id (ldb/get-graph-rtc-uuid (db/get-db))
        online-users @(::online-users state)]
    (when rtc-graph-id
      [:div.rtc-collaborators.flex.gap-1.text-sm.py-2.bg-gray-01.items-center
       (shui/button-ghost-icon :user-plus
                               {:on-click #(shui/dialog-open!
                                            (fn []
                                              [:div.p-2.-mb-8
                                               [:h1.text-3xl.-mt-2.-ml-2 "Collaborators:"]
                                               (settings/settings-collaboration)]))})

       (when (seq online-users)
         (for [{user-email :user/email
                user-name :user/name
                user-uuid :user/uuid} online-users
               :let [color (shui-util/uuid-color user-uuid)]]
           (when user-name
             (shui/avatar
              {:class "w-5 h-5"
               :style {:app-region "no-drag"}
               :title user-email}
              (shui/avatar-fallback
               {:style {:background-color (str color "50")
                        :font-size 11}}
               (some-> (subs user-name 0 2) (string/upper-case)))))))])))

(rum/defc left-menu-button < rum/reactive
  < {:key-fn #(identity "left-menu-toggle-button")}
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:button.#left-menu.cp__header-left-menu.button.icon
     {:title (t :header/toggle-left-sidebar)
      :on-click on-click}
     (ui/icon "menu-2" {:size ui/icon-size})]))

(defn bug-report-url []
  (let [ua (.-userAgent js/navigator)
        safe-ua (string/replace ua #"[^_/a-zA-Z0-9\.\(\)]+" " ")
        platform (str "App Version: " version "\n"
                      "Git Revision: " config/REVISION "\n"
                      "Platform: " safe-ua "\n"
                      "Language: " (.-language js/navigator) "\n"
                      "Plugins: " (string/join ", " (map (fn [[k v]]
                                                           (str (name k) " (" (:version v) ")"))
                                                         (:plugin/installed-plugins @state/state))))]
    (str "https://github.com/logseq/logseq/issues/new?"
         "title=&"
         "template=bug_report.yaml&"
         "labels=from:in-app&"
         "platform="
         (js/encodeURIComponent platform))))

(rum/defc ^:large-vars/cleanup-todo toolbar-dots-menu < rum/reactive
  [{:keys [current-repo t]}]
  (let [page (some-> (sidebar/get-current-page) db/get-page)
        page-menu (if (ldb/page? page)
                    (page-menu/page-menu page)
                    (when-not config/publishing?
                      (when (config/db-based-graph?)
                        (let [block-id-str (str (:block/uuid page))
                              favorited? (page-handler/favorited? block-id-str)]
                          [{:title   (if favorited?
                                       (t :page/unfavorite)
                                       (t :page/add-to-favorites))
                            :options {:on-click
                                      (fn []
                                        (if favorited?
                                          (page-handler/<unfavorite-page! block-id-str)
                                          (page-handler/<favorite-page! block-id-str)))}}]))))
        page-menu-and-hr (concat page-menu [{:hr true}])
        login? (and (state/sub :auth/id-token) (user-handler/logged-in?))
        items (fn []
                (->>
                 [(when (state/enable-editing?)
                    {:title (t :settings)
                     :options {:on-click state/open-settings!}
                     :icon (ui/icon "settings")})

                  (when config/lsp-enabled?
                    {:title (t :plugins)
                     :options {:on-click #(plugin-handler/goto-plugins-dashboard!)}
                     :icon (ui/icon "apps")})

                  {:title (t :appearance)
                   :options {:on-click #(state/pub-event! [:ui/toggle-appearance])}
                   :icon (ui/icon "color-swatch")}

                  (when current-repo
                    {:title (t :export-graph)
                     :options {:on-click #(shui/dialog-open! export/export)}
                     :icon (ui/icon "database-export")})

                  (when (and current-repo (state/enable-editing?))
                    {:title (t :import)
                     :options {:href (rfe/href :import)}
                     :icon (ui/icon "file-upload")})

                  (when config/publishing?
                    {:title (t :toggle-theme)
                     :options {:on-click #(state/toggle-theme!)}
                     :icon (ui/icon "bulb")})

                  ;; Disable login on Web until RTC is ready
                  (when (and (not login?)
                             (or
                              (storage/get :login-enabled)
                              (not util/web-platform?)))
                    {:title (t :login)
                     :options {:on-click #(state/pub-event! [:user/login])}
                     :icon (ui/icon "user")})

                  (when login? {:hr true})
                  (when login?
                    {:item [:span.flex.flex-col.relative.group.pt-1.w-full
                            [:b.leading-none (user-handler/username)]
                            [:small.opacity-70 (user-handler/email)]
                            [:i.absolute.opacity-0.group-hover:opacity-100.text-red-rx-09
                             {:class "right-1 top-3" :title (t :logout)}
                             (ui/icon "logout")]]
                     :options {:on-click #(user-handler/logout)
                               :class "w-full"}})]
                 (concat page-menu-and-hr)
                 (remove nil?)))]

    (shui/button-ghost-icon :dots
                            {:title (t :header/more)
                             :class "toolbar-dots-btn"
                             :on-pointer-down (fn [^js e]
                                                (shui/popup-show! (.-target e)
                                                                  (fn [{:keys [id]}]
                                                                    (for [{:keys [hr item title options icon]} (items)]
                                                                      (let [on-click' (:on-click options)
                                                                            href (:href options)]
                                                                        (if hr
                                                                          (shui/dropdown-menu-separator)
                                                                          (shui/dropdown-menu-item
                                                                           (assoc options
                                                                                  :on-click (fn [^js e]
                                                                                              (when on-click'
                                                                                                (when-not (false? (on-click' e))
                                                                                                  (shui/popup-hide! id)))))
                                                                           (or item
                                                                               (if href
                                                                                 [:a.flex.items-center.w-full
                                                                                  {:href href :on-click #(shui/popup-hide! id)
                                                                                   :style {:color "inherit"}}
                                                                                  [:span.flex.items-center.gap-1.w-full
                                                                                   icon [:div title]]]
                                                                                 [:span.flex.items-center.gap-1.w-full
                                                                                  icon [:div title]])))))))
                                                                  {:align "end"
                                                                   :as-dropdown? true
                                                                   :content-props {:class "w-64"
                                                                                   :align-offset -32}}))})))

(rum/defc back-and-forward
  < {:key-fn #(identity "nav-history-buttons")}
  []
  [:div.flex.flex-row
   (ui/with-shortcut :go/backward "bottom"
     (shui/button-ghost-icon :arrow-left
                             {:title (t :header/go-back) :on-click #(js/window.history.back)
                              :class "it navigation nav-left"}))

   (ui/with-shortcut :go/forward "bottom"
     (shui/button-ghost-icon :arrow-right
                             {:title (t :header/go-forward) :on-click #(js/window.history.forward)
                              :class "it navigation nav-right"}))])

(rum/defc updater-tips-new-version
  [t]
  (let [[downloaded, set-downloaded] (rum/use-state nil)
        _ (hooks/use-effect!
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

(defn- clear-recent-highlight!
  []
  (let [nodes (d/by-class "recent-block")]
    (when (seq nodes)
      (doseq [node nodes]
        (d/remove-class! node "recent-block")))))

(rum/defc recent-slider-inner
  []
  (let [[recent-days set-recent-days!] (rum/use-state (state/get-highlight-recent-days))
        [thumb-ref set-thumb-ref!] (rum/use-state nil)]
    (hooks/use-effect!
     (fn []
       (when thumb-ref
         (.focus ^js thumb-ref)))
     [thumb-ref])
    (hooks/use-effect!
     (fn []
       (let [all-nodes (d/by-class "ls-block")
             recent-node (fn [node]
                           (let [id (some-> (d/attr node "blockid") uuid)
                                 block (db/entity [:block/uuid id])]
                             (when block
                               (t/after?
                                (tc/from-long (:block/updated-at block))
                                (t/ago (t/days recent-days))))))
             recent-nodes (filter recent-node all-nodes)
             old-nodes (remove recent-node all-nodes)]
         (when (seq recent-nodes)
           (doseq [node recent-nodes]
             (d/add-class! node "recent-block")))
         (when (seq old-nodes)
           (doseq [node old-nodes]
             (d/remove-class! node "recent-block")))))
     [recent-days])
    [:div.recent-slider.flex.flex-row.gap-1.items-center
     {:class "w-[32%]"}
     (shui/slider
      {:class "relative flex w-full touch-none select-none items-center "
       :default-value #js [3 100]
       :on-value-change (fn [result]
                          (set-recent-days! (first result))
                          (state/set-highlight-recent-days! (first result)))
       :minStepsBetweenThumbs 1}
      (shui/slider-track
       {:class "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"})
      (shui/tooltip-provider
       (shui/tooltip
        (shui/tooltip-trigger
         {:as-child true
          :on-click (fn [e] (.preventDefault e))}
         (shui/slider-thumb
          {:ref set-thumb-ref!
           :class "block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none"}))
        (shui/tooltip-content
         {:onPointerDownOutside (fn [e] (.preventDefault e))}
         (str "Highlight recent blocks"
              (when (not= recent-days 0)
                (str ": " recent-days " days ago")))))))
     (shui/button
      {:variant :ghost
       :size :sm
       :title "Quit highlight recent blocks"
       :class "opacity-50 hover:opacity-100"
       :on-click (fn [] (state/toggle-highlight-recent-blocks!))}
      (ui/icon "x" {:size 16}))]))

(rum/defc recent-slider < rum/reactive
  {:will-update (fn [state]
                  (when-not @(:ui/toggle-highlight-recent-blocks? @state/state)
                    (clear-recent-highlight!))
                  state)}
  []
  (when (state/sub :ui/toggle-highlight-recent-blocks?)
    (recent-slider-inner)))

(rum/defc ^:large-vars/cleanup-todo header < rum/reactive
  [{:keys [current-repo default-home new-block-mode]}]
  (let [_ (state/sub [:user/info :UserGroups])
        electron-mac? (and util/mac? (util/electron?))
        left-menu (left-menu-button {:on-click (fn []
                                                 (state/set-left-sidebar-open!
                                                  (not (:ui/left-sidebar-open? @state/state))))})
        custom-home-page? (and (state/custom-home-page?)
                               (= (state/sub-default-home-page) (state/get-current-page)))]
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
                 (user-handler/logged-in?)
                 (config/db-based-graph? current-repo)
                 (user-handler/team-member?))
        [:<>
         (recent-slider)
         (rum/with-key (rtc-collaborators)
           (str "collab-" current-repo))
         (rtc-indicator/indicator)])

      (when (and current-repo
                 (not (config/demo-graph? current-repo))
                 (not (config/db-based-graph? current-repo))
                 (user-handler/alpha-or-beta-user?))
        (fs-sync/indicator))

      (when (and (not= (state/get-current-route) :home)
                 (not custom-home-page?))
        (home-button))

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

      (when config/publishing?
        [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
         (t :graph)])

      (toolbar-dots-menu {:t            t
                          :current-repo current-repo
                          :default-home default-home})

      (sidebar/toggle)

      (updater-tips-new-version t)]]))
