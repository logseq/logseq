(ns frontend.components.header
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [dommy.core :as d]
            [electron.ipc :as ipc]
            [frontend.components.avatar :as avatar]
            [frontend.components.block :as component-block]
            [frontend.components.email :as email-component]
            [frontend.components.export :as export]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.right-sidebar :as sidebar]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.components.server :as server]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler :as handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.email :as email-util]
            [frontend.version :refer [version]]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.version :as build-version]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc home-button
  []
  (ui/tooltip
   (shui/button-ghost-icon :home
                           {:on-click #(do
                                         (when (mobile-util/native-iphone?)
                                           (state/set-left-sidebar-open! false))
                                         (route-handler/redirect-to-home!))})
   (t :nav/home)
   {:trigger-props {:as-child true}}))

(defn current-local-uploadable-graph
  []
  (let [current-repo (state/get-current-repo)]
    (some (fn [{:keys [url] :as graph}]
            (when (and (= current-repo url)
                       (repo/local-uploadable-graph?
                        (assoc graph :rtc-graph?
                               (boolean (ldb/get-graph-rtc-uuid (db/get-db current-repo))))))
              graph))
          (state/get-repos))))

(defn- current-remote-rtc-graph
  [current-repo rtc-graphs]
  (some #(when (= current-repo (:url %)) %) rtc-graphs))

(defn- rtc-indicator-visible?
  [{:keys [current-repo rtc-graphs db-rtc-uuid rtc-state logged-in? rtc-group?]}]
  (let [remote-graph (current-remote-rtc-graph current-repo rtc-graphs)
        remote-graph-uuid (some-> (:GraphUUID remote-graph) str)
        state-graph-uuid (some-> (:graph-uuid rtc-state) str)]
    (and current-repo
         logged-in?
         rtc-group?
         remote-graph
         (or db-rtc-uuid
             (and (seq state-graph-uuid)
                  (= state-graph-uuid remote-graph-uuid))))))

(defn local-graph-sync-button
  [graph]
  (ui/tooltip
   (shui/button-ghost-icon :cloud
                           {:class "local-graph-sync-btn"
                            :on-click #(repo/upload-local-graph-with-confirm! graph)})
   (t :graph/use-sync-beta)
   {:trigger-props {:as-child true}}))

(hsx/defc rtc-collaborators
  []
  (let [rtc-graph-id (ldb/get-graph-rtc-uuid (db/get-db))
        config (state/use-sub-config)
        online-users (hooks/use-flow-state nil rtc-flows/rtc-online-users-flow)]
    (when rtc-graph-id
      [:div.rtc-collaborators.flex.gap-1.text-sm.bg-gray-01.items-center
       (shui/button-ghost-icon :user-plus
                               {:on-click #(shui/dialog-open!
                                            (fn []
                                              [:div.p-2.-mb-8
                                               [:h1.text-3xl.-mt-2.-ml-2 (t :collaboration/members)]
                                               (settings/settings-collaboration)])
                                            {:id :rtc-collaborators})})

       (when (seq online-users)
         (for [{user-email :user/email
                user-name :user/name
                user-uuid :user/uuid} online-users]
           (when user-name
             (avatar/user-avatar
              {:class "w-5 h-5"
               :style {:app-region "no-drag"}
               :title (email-util/display-email user-email config)
               :name user-name
               :uuid user-uuid
               :fallback-props {:style {:font-size 11}}}))))])))

(hsx/defc left-menu-button
  [{:keys [on-click]}]
  (ui/with-shortcut :ui/toggle-left-sidebar "bottom"
    [:button.#left-menu.cp__header-left-menu.button.icon
     {:on-click on-click}
     (ui/icon "menu-2" {:size ui/icon-size})]
    (t :header/toggle-left-sidebar)))

(defn bug-report-url []
  (let [ua (.-userAgent js/navigator)
        safe-ua (string/replace ua #"[^_/a-zA-Z0-9\.\(\)]+" " ")
        platform (str "App Version: " version "\n"
                      "Git Revision: " (build-version/revision) "\n"
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

(defn- stop-event!
  [^js e]
  (.preventDefault e)
  (.stopPropagation e))

(hsx/defc ^:large-vars/cleanup-todo toolbar-dots-menu
  [{:keys [current-repo t]}]
  (let [_route-match (state/use-sub :route-match)
        current-page (sidebar/get-current-page)
        page (or (some-> current-page db/get-page)
                 (when (util/uuid-string? current-page)
                   (db/entity [:block/uuid (uuid current-page)])))
        ;; FIXME: in publishing? :block/tags incorrectly returns integer until fully restored
        db-storing? (state/use-sub :db/restoring?)
        working-page? (if config/publishing? (not db-storing?) true)
        page-menu-items (fn []
                          (if (and working-page? (ldb/page? (or (some-> page :db/id db/entity) page)))
                            (page-menu/page-menu page)
                            (when-not config/publishing?
                              (let [block-id-str (str (:block/uuid page))
                                    favorited? (page-handler/favorited? block-id-str)]
                                [{:title   (if favorited?
                                             (t :page/unfavorite)
                                             (t :page/add-to-favorites))
                                  :options {:on-click
                                            (fn []
                                              (if favorited?
                                                (page-handler/<unfavorite-page! block-id-str)
                                                (page-handler/<favorite-page! block-id-str)))}}
                                 {:title   (t :publish/dialog-title)
                                  :options {:on-click #(shui/dialog-open! (fn [] (page-menu/publish-page-dialog page))
                                                                          {:class "w-auto max-w-md"})}}]))))
        login? (and (state/use-sub :auth/id-token) (user-handler/logged-in?))
        items (fn []
                (->>
                 [(when (state/enable-editing?)
                    {:title (t :nav/settings)
                     :options {:on-click state/open-settings!}
                     :icon (ui/icon "settings")})

                  (when config/lsp-enabled?
                    {:title (t :nav/plugins)
                     :options {:on-click #(plugin-handler/goto-plugins-dashboard!)}
                     :icon (ui/icon "apps")})

                  {:title (t :nav/appearance)
                   :options {:on-click #(state/pub-event! [:ui/toggle-appearance])}
                   :icon (ui/icon "color-swatch")}

                  (when (db/get-page common-config/recycle-page-name)
                    {:title (t :storage.recycle/title)
                     :options {:on-click page-handler/open-recycle!}
                     :icon (ui/icon "trash")})

                  (when current-repo
                    {:title (t :export/graph)
                     :options {:on-click #(shui/dialog-open! export/export)}
                     :icon (ui/icon "database-export")})

                  (when (and current-repo (state/enable-editing?))
                    {:title (t :import/title)
                     :options {:href (rfe/href :import)}
                     :icon (ui/icon "file-upload")})

                  (when config/publishing?
                    {:title (t :ui/toggle-theme)
                     :options {:on-click #(state/toggle-theme!)}
                     :icon (ui/icon "bulb")})

                  (when-not (or config/publishing? login?)
                    {:title (t :ui/login)
                     :options {:on-click #(state/pub-event! [:user/login])}
                     :icon (ui/icon "user")})

                  (when login? {:hr true})
                  (when login?
                    {:item [:span.flex.flex-col.relative.group.pt-1.w-full
                            [:b.leading-none (user-handler/username)]
                            [:small.opacity-70
                             (email-component/email-address {:email (user-handler/email)})]
                            (ui/tooltip
                             (shui/button
                              {:type "button"
                               :variant :ghost
                               :size :icon
                               :class "absolute right-1 top-3 h-auto w-auto min-w-0 border-0 bg-transparent p-0 text-red-rx-09 opacity-0 group-hover:opacity-100"
                               :aria-label (t :ui/logout)
                               :on-pointer-down stop-event!
                               :on-click (fn [e]
                                           (stop-event! e)
                                           (user-handler/logout)
                                           (shui/popup-hide!))}
                              (ui/icon "logout"))
                             (t :ui/logout))]
                     :options {:on-select (fn [^js e] (.preventDefault e))
                               :class "w-full"}})]
                 (concat (page-menu-items) [{:hr true}])
                 (remove nil?)))]

    (ui/tooltip
     (shui/button-ghost-icon
      :dots {:class "toolbar-dots-btn"
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
                                                                   :align-offset -32}}))})
     (t :header/more)
     {:trigger-props {:as-child true}})))

(hsx/defc back-and-forward
  []
  [:div.flex.flex-row
   (ui/with-shortcut :go/backward "bottom"
     (shui/button-ghost-icon
      :arrow-left {:on-click #(js/window.history.back)
                   :class "it navigation nav-left"})
     (t :header/go-back))

   (ui/with-shortcut :go/forward "bottom"
     (shui/button-ghost-icon
      :arrow-right {:on-click #(js/window.history.forward)
                    :class "it navigation nav-right"})
     (t :header/go-forward))])

(hsx/defc updater-tips-new-version
  [t]
  (let [[downloaded, set-downloaded] (hooks/use-state nil)
        _ (hooks/use-effect!
           (fn []
             (when (util/electron?)
               (-> (ipc/invoke "get-downloaded-update")
                   (p/then
                    (fn [args]
                      (when args
                        (let [args (bean/->clj args)]
                          (set-downloaded args)
                          (state/set-state! :electron/auto-updater-downloaded args)))))
                   (p/catch (fn [_] nil)))
               (let [channel "auto-updater-downloaded"
                     callback (fn [_ args]
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
       [:p (t :updater/update-ready-to-install)
        [:a.restart.ml-2
         {:on-click #(handler/quit-and-install-new-version!)}
         (svg/reload 16) [:strong (t :updater/quit-and-install)]]]])))

(defn- clear-recent-highlight!
  []
  (let [nodes (d/by-class "recent-block")]
    (when (seq nodes)
      (doseq [node nodes]
        (d/remove-class! node "recent-block")))))

(hsx/defc recent-slider-inner
  []
  (let [[recent-days set-recent-days!] (hooks/use-state (state/get-highlight-recent-days))
        [thumb-ref set-thumb-ref!] (hooks/use-state nil)]
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
         (if (zero? recent-days)
           (t :header/highlight-recent-blocks)
           (t :header/highlight-recent-blocks-days-ago recent-days))))))
     (shui/button
      {:variant :ghost
       :size :sm
       :title (t :header/quit-highlight-recent-blocks)
       :class "opacity-50 hover:opacity-100"
       :on-click (fn [] (state/toggle-highlight-recent-blocks!))}
      (ui/icon "x" {:size 16}))]))

(hsx/defc recent-slider
  []
  (let [highlight? (state/use-sub :ui/toggle-highlight-recent-blocks?)]
    (hooks/use-effect!
     (fn []
       (when-not highlight?
         (clear-recent-highlight!)))
     [highlight?])
    (when highlight?
      (recent-slider-inner))))

(hsx/defc block-breadcrumb
  [page-name]
  (let [db-restoring? (state/use-sub :db/restoring?)]
    (when-let [page (when (and page-name (common-util/uuid-string? page-name))
                      (db/entity [:block/uuid (uuid page-name)]))]
      ;; FIXME: in publishing? :block/tags incorrectly returns integer until fully restored
      (when (and (if config/publishing? (not db-restoring?) true)
                 (ldb/page? page) (:block/parent page))
        [:div.ls-block-breadcrumb
         [:div.text-sm
          (component-block/breadcrumb {}
                                      (state/get-current-repo)
                                      (:block/uuid page)
                                      {:header? true})]]))))

(hsx/defc search-index-progress
  []
  (let [current-repo (state/get-current-repo)
        {:keys [visible? running? repo progress]} (or (state/use-sub :search/index-build) {})
        progress' (-> (or progress 0)
                      (max 0)
                      (min 100))]
    (when (and (or visible? running?) (= repo current-repo))
      [:div.search-index-progress
       (ui/loading "")
       [:span.search-index-progress__text (t :search/index-progress progress')]
       [:div.search-index-progress__bar
        [:div.search-index-progress__bar-fill {:style {:width (str progress' "%")}}]]])))

(hsx/defc ^:large-vars/cleanup-todo header-aux
  [{:keys [current-repo default-home new-block-mode]}]
  (let [electron-mac? (and util/mac? (util/electron?))
        *search-editor-info (hooks/use-ref nil)
        rtc-graphs (state/use-sub :rtc/graphs)
        rtc-state (state/use-sub :rtc/state)
        db-rtc-uuid (ldb/get-graph-rtc-uuid (db/get-db))
        default-home-page (state/use-sub-default-home-page)
        left-menu (left-menu-button {:on-click (fn []
                                                 (state/set-left-sidebar-open!
                                                  (not (:ui/left-sidebar-open? @state/state))))})
        custom-home-page? (and (state/custom-home-page?)
                               (= default-home-page (state/get-current-page)))
        electron-server (state/use-sub :electron/server)]
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
     [:div.l.flex.items-center.drag-region
      left-menu
      (if (mobile-util/native-platform?)
        ;; back button for mobile
        (when-not (or (state/home?) custom-home-page?)
          (ui/with-shortcut :go/backward "bottom"
            [:button.it.navigation.nav-left.button.icon.opacity-70
             {:on-click #(js/window.history.back)}
             (ui/icon "chevron-left" {:size 26})]
            (t :header/go-back)))
        ;; search button for non-mobile
        (when current-repo
          (ui/with-shortcut :go/search "right"
            [:button.button.icon#search-button
             {:data-keep-selection true
              :on-pointer-down #(hooks/set-ref! *search-editor-info (state/get-editor-info))
              :on-click #(let [editor-info (hooks/deref *search-editor-info)]
                           (hooks/set-ref! *search-editor-info nil)
                           (when (or (mobile-util/native-android?)
                                     (mobile-util/native-iphone?))
                             (state/set-left-sidebar-open! false))
                           (state/pub-event! [:go/search {:editor-info editor-info}]))}
             (ui/icon "search" {:size ui/icon-size})]
            (t :nav/search))))]

     [:div.r.flex.drag-region.justify-between.items-center.gap-2.overflow-x-hidden.w-full
      [:div.flex.flex-1
       (block-breadcrumb (state/get-current-page))]
      [:div.flex.items-center
       (when (rtc-indicator-visible?
              {:current-repo current-repo
               :rtc-graphs rtc-graphs
               :db-rtc-uuid db-rtc-uuid
               :rtc-state rtc-state
               :logged-in? (user-handler/logged-in?)
               :rtc-group? (user-handler/rtc-group?)})
         [:<>
          (recent-slider)
          ^{:key (str "collab-" current-repo)}
          [rtc-collaborators]
          (rtc-indicator/indicator)])

       (when (user-handler/logged-in?)
         (rtc-indicator/downloading-detail))
       (when (user-handler/logged-in?)
         (rtc-indicator/uploading-detail))
       (search-index-progress)

       (when-let [graph (current-local-uploadable-graph)]
         (local-graph-sync-button graph))

       (when (and (not= (state/get-current-route) :home)
                  (not custom-home-page?))
         (home-button))

       (when config/lsp-enabled?
         [:<>
          (plugins/hook-ui-items :toolbar)
          (plugins/updates-notifications)])

       (when (state/feature-http-server-enabled?)
         (server/server-indicator electron-server))

       (when (util/electron?)
         (back-and-forward))

       (when-not (mobile-util/native-platform?)
         (new-block-mode))

       (when config/publishing?
         [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
          (t :nav/graph)])

       (toolbar-dots-menu {:t            t
                           :current-repo current-repo
                           :default-home default-home})

       (sidebar/toggle)

       (updater-tips-new-version t)]]]))

(def ^:private header-related-flow
  (m/latest
   (fn [state rtc-running?]
     {:user-groups (get-in state [:user/info :UserGroups])
      :rtc-running? rtc-running?})
   (m/watch state/state) rtc-flows/rtc-running-flow))

(hsx/defc header
  [opts]
  (let [_m (hooks/use-flow-state header-related-flow)]
    (header-aux opts)))
