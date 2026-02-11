(ns frontend.components.repo
  (:require [clojure.string :as string]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.graph :as graph]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc normalized-graph-label
  [{:keys [url remote? graph-e2ee?] :as graph} on-click]
  (when graph
    [:span.flex.items-center
     (let [local-dir (config/get-local-dir url)
           graph-name (text-util/get-graph-name-from-path url)]
       [:a.flex.items-center {:title local-dir
                              :on-click #(on-click graph)}
        [:span graph-name]
        (when remote? [:strong.px-1.flex.items-center (ui/icon (if graph-e2ee? "lock" "cloud"))])])]))

(defn sort-repos-with-metadata-local
  [repos]
  (if-let [m (and (seq repos) (graph/get-metadata-local))]
    (->> repos
         (map (fn [r] (merge r (get m (:url r)))))
         (sort (fn [r1 r2]
                 (compare (or (:last-seen-at r2) (:created-at r2))
                          (or (:last-seen-at r1) (:created-at r1))))))
    repos))

(defn- safe-locale-date
  [dst]
  (when (number? dst)
    (try
      (.toLocaleString (js/Date. dst))
      (catch js/Error _e nil))))

(rum/defc ^:large-vars/cleanup-todo repos-inner
  "Graph list in `All graphs` page"
  [repos]
  (for [{:keys [root url remote? GraphUUID GraphSchemaVersion GraphName created-at last-seen-at] :as repo}
        (sort-repos-with-metadata-local repos)
        :let [graph-name (config/db-graph-name url)]]
    [:div.flex.justify-between.mb-2.items-center.group {:key (or url GraphUUID)
                                                        "data-testid" url}
     [:div
      [:span.flex.items-center.gap-1
       (normalized-graph-label repo
                               (fn []
                                 (when-not (state/sub :rtc/downloading-graph-uuid)
                                   (cond
                                     root ; exists locally
                                     (state/pub-event! [:graph/switch url])

                                     remote?
                                     (state/pub-event! [:rtc/download-remote-graph GraphName GraphUUID GraphSchemaVersion])

                                     :else
                                     (when-not (util/capacitor?)
                                       (state/pub-event! [:graph/pull-down-remote-graph repo]))))))]
      (when-let [time (some-> (or last-seen-at created-at) (safe-locale-date))]
        [:small.text-muted-foreground (str "Last opened at: " time)])]

     [:div.controls
      [:div.flex.flex-row.items-center
       (when (util/electron?)
         [:a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex
          {:on-click #(util/open-url (str "file://" root))}
          (shui/tabler-icon "folder-pin") [:span.pl-1 root]])

       (let [manager? (user-handler/manager? url)]
         (shui/dropdown-menu
          (shui/dropdown-menu-trigger
           {:asChild true}
           (shui/button
            {:variant "ghost"
             :class "graph-action-btn !px-1"
             :size :sm}
            (ui/icon "dots" {:size 15})))
          (shui/dropdown-menu-content
           {:align "end"}
           (when root
             (shui/dropdown-menu-item
              {:key "delete-locally"
               :class "delete-local-graph-menu-item"
               :on-click (fn []
                           (let [prompt-str (str "Are you sure you want to permanently delete the graph \"" graph-name "\" from Logseq?")]
                             (-> (shui/dialog-confirm!
                                  [:p.font-medium.-my-4 prompt-str
                                   [:span.my-2.flex.font-normal.opacity-75
                                    [:small "⚠️ Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."]]])
                                 (p/then (fn []
                                           (repo-handler/remove-repo! repo))))))}
              "Delete local graph"))
           (when (and root
                      (user-handler/logged-in?)
                      (user-handler/rtc-group?)
                      (not remote?)
                      (= url (state/get-current-repo)))
             (shui/dropdown-menu-item
              {:key "logseq-sync"
               :class "use-logseq-sync-menu-item"
               :on-click (fn []
                           (let [repo (state/get-current-repo)
                                 token (state/get-auth-id-token)
                                 remote-graph-name (config/db-graph-name (state/get-current-repo))]
                             (when (and token remote-graph-name)
                               (rtc-handler/<rtc-upload-graph! repo token remote-graph-name)
                               (when (util/mobile?)
                                 (shui/popup-show! nil
                                                   (fn []
                                                     (rtc-indicator/uploading-logs))
                                                   {:id :rtc-graph-upload-log}))

                               (rtc-indicator/on-upload-finished-task
                                (fn []
                                  (when (util/mobile?) (shui/popup-hide! :rtc-graph-upload-log))
                                  (p/do!
                                   (rtc-flows/trigger-rtc-start repo)
                                   (rtc-handler/<get-remote-graphs)))))))}
              "Use Logseq sync (Beta testing)"))

           (when (and remote?
                      manager?)
             (shui/dropdown-menu-item
              {:key "delete-remotely"
               :class "delete-remote-graph-menu-item"
               :on-click (fn []
                           (let [prompt-str (str "Are you sure you want to permanently delete the graph \"" graph-name "\" from our server?")]
                             (-> (shui/dialog-confirm!
                                  [:p.font-medium.-my-4 prompt-str
                                   [:span.my-2.flex.font-normal.opacity-75
                                    [:small "⚠️ Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."]]])
                                 (p/then
                                  (fn []
                                    (state/set-state! :rtc/loading-graphs? true)
                                    (when (= (state/get-current-repo) repo)
                                      (state/<invoke-db-worker :thread-api/rtc-stop))
                                    (p/do! (rtc-handler/<rtc-delete-graph! GraphUUID GraphSchemaVersion)
                                           (state/set-state! :rtc/loading-graphs? false)
                                           (rtc-handler/<get-remote-graphs)))))))}
              "Delete from server"))

           (when (and remote? (not manager?))
             (shui/dropdown-menu-item
              {:key "leave-shared-graph"
               :class "leave-shared-graph-menu-item"
               :on-click (fn []
                           (let [prompt-str "Are you sure you want to leave this graph?"]
                             (-> (shui/dialog-confirm!
                                  [:p.font-medium.-my-4 prompt-str])
                                 (p/then
                                  (fn []
                                    (state/set-state! :rtc/loading-graphs? true)
                                    (when (= (state/get-current-repo) repo)
                                      (state/<invoke-db-worker :thread-api/rtc-stop))
                                    (-> (rtc-handler/<rtc-leave-graph! GraphUUID)
                                        (p/then (fn []
                                                  (notification/show! "Left graph." :success)
                                                  (rtc-handler/<get-remote-graphs)))
                                        (p/catch (fn [e]
                                                   (notification/show! "Failed to leave graph." :error)
                                                   (log/error :db-sync/leave-graph-failed
                                                              {:error e
                                                               :graph-uuid GraphUUID})))
                                        (p/finally (fn []
                                                     (state/set-state! :rtc/loading-graphs? false)))))))))}
              "Leave this graph")))))]]]))

(rum/defc repos-cp < rum/reactive
  {:will-mount (fn [state]
                 (let [login? (:auth/id-token @state/state)]
                   (when (and login? (user-handler/rtc-group?))
                     (rtc-handler/<get-remote-graphs)))
                 state)}
  []
  (let [login? (boolean (state/sub :auth/id-token))
        repos (state/sub [:me :repos])
        repos (util/distinct-by :url repos)
        remotes (state/sub :rtc/graphs)
        remotes-loading? (state/sub :rtc/loading-graphs?)
        repos (->> (if (and login? (seq remotes))
                     (repo-handler/combine-local-&-remote-graphs repos remotes)
                     repos)
                   (util/distinct-by :url))
        repos (cond->>
               (remove #(= (:url %) config/demo-repo) repos)
                true
                (filter (fn [item]
                          ;; use `config/db-based-graph?` to avoid loading old file graphs
                          (config/db-based-graph? (:url item)))))
        {remote-graphs true local-graphs false} (group-by (comp boolean :remote?) repos)
        {own-graphs true shared-graphs false}
        (group-by (fn [graph] (= "manager" (:graph<->user-user-type graph))) remote-graphs)]
    [:div#graphs
     (when-not (util/capacitor?)
       [:h1.title (t :graph/all-graphs)])

     [:div.pl-1.content
      {:class (when-not (util/mobile?) "mt-8")}
      (when-not (util/mobile?)
        [:div.flex.flex-row.my-8
         [:div.mr-8
          (ui/button
           "Create a new graph"
           :on-click #(state/pub-event! [:graph/new-db-graph]))]])

      [:div
       [:h2.text-lg.font-medium.mb-4 (t :graph/local-graphs)]
       (when (seq local-graphs)
         (repos-inner local-graphs))]

      (when (and (user-handler/rtc-group?)
                 (seq remote-graphs)
                 login?)
        [:<>
         (when (seq own-graphs)
           [:div
            [:hr.mt-8]
            [:div.flex.align-items.justify-between
             [:h2.text-lg.font-medium.mb-4 (t :graph/remote-graphs)]
             [:div
              (ui/button
               [:span.flex.items-center "Refresh"
                (when remotes-loading? [:small.pl-2 (ui/loading nil)])]
               :background "gray"
               :disabled remotes-loading?
               :on-click (fn [] (rtc-handler/<get-remote-graphs)))]]
            (repos-inner own-graphs)])

         (when (seq shared-graphs)
           [:div
            [:hr.mt-8]
            [:div.flex.align-items.justify-between
             [:h2.text-lg.font-medium.mb-4 (t :graph/shared-graphs)]]
            (repos-inner shared-graphs)])])]]))

(defn- repos-dropdown-links [repos current-repo downloading-graph-id & {:as opts}]
  (let [switch-repos (if-not (nil? current-repo)
                       (remove (fn [repo] (= current-repo (:url repo))) repos) repos) ; exclude current repo
        repo-links (mapv
                    (fn [{:keys [url remote? graph-e2ee? rtc-graph? GraphName GraphSchemaVersion GraphUUID] :as graph}]
                      (let [repo-url url
                            short-repo-name (text-util/get-graph-name-from-path repo-url)
                            downloading? (and downloading-graph-id (= GraphUUID downloading-graph-id))]
                        (when short-repo-name
                          {:title [:span.flex.items-center.title-wrap short-repo-name
                                   (when remote? [:span.pl-1.flex.items-center
                                                  {:title (str "<" GraphName "> #" GraphUUID)}
                                                  (ui/icon (if graph-e2ee? "lock" "cloud") {:size 18})
                                                  (when downloading?
                                                    [:span.opacity.text-sm.pl-1 "downloading"])])]
                           :hover-detail repo-url ;; show full path on hover
                           :options {:on-click
                                     (fn [e]
                                       (when-not downloading?
                                         (when-let [on-click (:on-click opts)]
                                           (on-click e))
                                         (if (and (gobj/get e "shiftKey")
                                                  (not (and rtc-graph? remote?)))
                                           (state/pub-event! [:graph/open-new-window url])
                                           (cond
                                                  ;; exists locally?
                                             (or (:root graph) (not rtc-graph?))
                                             (state/pub-event! [:graph/switch url])

                                             (and rtc-graph? remote?)
                                             (state/pub-event!
                                              [:rtc/download-remote-graph GraphName GraphUUID GraphSchemaVersion])

                                             :else
                                             (state/pub-event! [:graph/pull-down-remote-graph graph])))))}})))
                    switch-repos)]
    (->> repo-links (remove nil?))))

(defn- repos-footer []
  [:div.cp__repos-quick-actions
   {:on-click #(shui/popup-hide!)}

   (when-not config/publishing?
     (shui/button
      {:size :sm :variant :ghost
       :on-click #(state/pub-event! [:graph/new-db-graph])}
      (shui/tabler-icon "database-plus")
      [:span (if util/electron? "Create db graph" "Create new graph")]))

   (when-not config/publishing?
     (shui/button
      {:size :sm :variant :ghost
       :on-click (fn [] (route-handler/redirect! {:to :import}))}
      (shui/tabler-icon "database-import")
      [:span (t :import-notes)]))

   (when-not config/publishing?
     (shui/button {:size :sm :variant :ghost
                   :on-click (fn []
                               (if (util/capacitor?)
                                 (state/pub-event! [:mobile/set-tab "graphs"])
                                 (route-handler/redirect-to-all-graphs)))}
                  (shui/tabler-icon "layout-2") [:span (t :all-graphs)]))])

(rum/defcs repos-dropdown-content < rum/reactive
  [_state & {:keys [contentid footer?] :as opts
             :or {footer? true}}]
  (let [current-repo (state/sub :git/current-repo)
        login? (boolean (state/sub :auth/id-token))
        repos (state/sub [:me :repos])
        rtc-graphs (state/sub :rtc/graphs)
        downloading-graph-id (state/sub :rtc/downloading-graph-uuid)
        remotes-loading? (state/sub :rtc/loading-graphs?)
        repos (sort-repos-with-metadata-local repos)
        repos (->>
               (if (and (seq rtc-graphs) login?)
                 (repo-handler/combine-local-&-remote-graphs repos rtc-graphs)
                 repos)

               (util/distinct-by :url))
        items-fn #(repos-dropdown-links repos current-repo downloading-graph-id opts)
        header-fn #(when (> (count repos) 1) ; show switch to if there are multiple repos
                     [:div.font-medium.md:text-sm.md:opacity-50.p-2.flex.flex-row.justify-between.items-center
                      [:h4.pb-1 (t :left-side-bar/switch)]

                      (when login?
                        (if remotes-loading?
                          (ui/loading "")
                          (shui/button
                           {:variant :ghost
                            :size :sm
                            :title "Refresh remote graphs"
                            :class "!h-6 !px-1 relative right-[-4px]"
                            :on-click (fn []
                                        (rtc-handler/<get-remote-graphs))}
                           (ui/icon "refresh" {:size 15}))))])
        _remote? (and current-repo (:remote? (first (filter #(= current-repo (:url %)) repos))))
        _repo-name (when current-repo (db/get-repo-name current-repo))]

    [:div
     {:class (when (<= (count repos) 1) "no-repos")}
     (header-fn)
     [:div.cp__repos-list-wrap
      (for [{:keys [hr item hover-detail title options icon]} (items-fn)]
        (let [on-click' (:on-click options)
              href' (:href options)
              menu-item (if (util/mobile?) ui/menu-link shui/dropdown-menu-item)]
          (if hr
            (if (util/mobile?) [:hr.py-2] (shui/dropdown-menu-separator))
            (menu-item
             (assoc options
                    :title hover-detail
                    :on-click (fn [^js e]
                                (when on-click'
                                  (when-not (false? (on-click' e))
                                    (shui/popup-hide! contentid)))))
             (or item
                 (if href'
                   [:a.flex.items-center.w-full
                    {:href href' :on-click #(shui/popup-hide! contentid)
                     :style {:color "inherit"}} title]
                   [:span.flex.items-center.gap-1.w-full
                    icon [:div title]]))))))]
     (when footer?
       (repos-footer))]))

(rum/defcs graphs-selector < rum/reactive
  [_state]
  (let [current-repo (state/get-current-repo)
        user-repos (state/get-repos)
        current-repo' (some->> user-repos (medley/find-first #(= current-repo (:url %))))
        repo-name (when current-repo (db/get-repo-name current-repo))
        remote? (:remote? current-repo')
        short-repo-name (if current-repo
                          (db/get-short-repo-name repo-name)
                          "Select a Graph")]
    [:div.cp__graphs-selector.flex.items-center.justify-between
     [:a.item.flex.items-center.gap-1.select-none
      {:title current-repo
       :on-click (fn [^js e]
                   (shui/popup-show! (.closest (.-target e) "a")
                                     (fn [{:keys [id]}] (repos-dropdown-content {:contentid id}))
                                     {:as-dropdown? true
                                      :content-props {:class "repos-list"}
                                      :align :start}))}
      [:span.thumb (shui/tabler-icon (if remote? "cloud" "topology-star") {:size 16})]
      [:strong short-repo-name]
      (shui/tabler-icon "selector" {:size 18})]]))

;; Update invalid-graph-name-warning if characters change
(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#\\\\")

(def reserved-chars-pattern
  (re-pattern (str "[" multiplatform-reserved-chars "]+")))

(defn include-reserved-chars?
  "Includes reserved characters that would broken FS"
  [s]
  (common-util/safe-re-find reserved-chars-pattern s))

(defn invalid-graph-name-warning
  []
  (notification/show!
   [:div
    [:p "Graph name can't contain following reserved characters:"]
    [:ul
     [:li "< (less than)"]
     [:li "> (greater than)"]
     [:li ": (colon)"]
     [:li "\" (double quote)"]
     [:li "/ (forward slash)"]
     [:li "\\ (backslash)"]
     [:li "| (vertical bar or pipe)"]
     [:li "? (question mark)"]
     [:li "* (asterisk)"]
     [:li "# (hash)"]
      ;; `+` is used to encode path that includes `:` or `/`
     [:li "+ (plus)"]]]
   :warning false))

(defn invalid-graph-name?
  "Returns boolean indicating if DB graph name is invalid. Must be kept in sync with invalid-graph-name-warning"
  [graph-name]
  (or (include-reserved-chars? graph-name)
      (string/includes? graph-name "+")
      (string/includes? graph-name "/")))

(defn ensure-e2ee-rsa-key-for-cloud!
  [{:keys [cloud? refresh-token token user-uuid e2ee-rsa-key-ensured?]} set-e2ee-rsa-key-ensured?]
  (if (and cloud? refresh-token token user-uuid (not e2ee-rsa-key-ensured?))
    (-> (p/let [rsa-key-pair (state/<invoke-db-worker :thread-api/db-sync-ensure-user-rsa-keys)]
          (set-e2ee-rsa-key-ensured? (some? rsa-key-pair)))
        (p/catch (fn [e]
                   (log/error :db-sync/ensure-user-rsa-keys-failed e)
                   e)))
    (p/resolved nil)))

(rum/defc new-db-graph
  []
  (let [[creating-db? set-creating-db?] (hooks/use-state false)
        [cloud? set-cloud?] (hooks/use-state false)
        [e2ee-rsa-key-ensured? set-e2ee-rsa-key-ensured?] (hooks/use-state nil)
        input-ref (hooks/create-ref)
        new-db-f (fn new-db-f
                   [graph-name]
                   (when-not (or (string/blank? graph-name)
                                 creating-db?)
                     (if (invalid-graph-name? graph-name)
                       (invalid-graph-name-warning)
                       (do
                         (set-creating-db? true)
                         (p/let [repo (repo-handler/new-db! graph-name
                                                            {:remote-graph? cloud?})]
                           (when cloud?
                             (->
                              (p/do
                                (state/set-state! :rtc/uploading? true)
                                (rtc-handler/<rtc-create-graph! repo)
                                (rtc-handler/<get-remote-graphs)
                                (rtc-flows/trigger-rtc-start repo))
                              (p/catch (fn [error]
                                         (log/error :create-db-failed error)))
                              (p/finally (fn []
                                           (state/set-state! :rtc/uploading? false)
                                           (set-creating-db? false)))))
                           (shui/dialog-close!))))))
        submit! (fn submit!
                  [^js e click?]
                  (when-let [value (and (or click? (= (gobj/get e "key") "Enter"))
                                        (util/trim-safe (.-value (rum/deref input-ref))))]
                    (new-db-f value)))]
    (hooks/use-effect!
     (fn []
       (when-let [^js input (hooks/deref input-ref)]
         (js/setTimeout #(.focus input) 32)))
     [])

    (hooks/use-effect!
     (fn []
       (let [token (state/get-auth-id-token)
             user-uuid (user-handler/user-uuid)
             refresh-token (state/get-auth-refresh-token)]
         (ensure-e2ee-rsa-key-for-cloud!
          {:cloud? cloud?
           :refresh-token refresh-token
           :token token
           :user-uuid user-uuid
           :e2ee-rsa-key-ensured? e2ee-rsa-key-ensured?}
          set-e2ee-rsa-key-ensured?)))
     [cloud?])

    [:div.new-graph.flex.flex-col.gap-4.p-1.pt-2
     (shui/input
      {:disabled creating-db?
       :ref input-ref
       :placeholder "your graph name"
       :on-key-down submit!
       :autoComplete "off"})
     (when (user-handler/rtc-group?)
       [:div.flex.flex-col
        [:div.flex.flex-row.items-center.gap-1
         (shui/checkbox
          {:id "rtc-sync"
           :value cloud?
           :on-checked-change
           (fn []
             (let [v (boolean (not cloud?))]
               (set-cloud? v)))})
         [:label.opacity-70.text-sm
          {:for "rtc-sync"}
          "Use Logseq Sync?"]]])
     (shui/button
      {:disabled (and cloud? (not e2ee-rsa-key-ensured?))
       :on-click #(submit! % true)
       :on-key-down submit!}
      (if creating-db?
        (ui/loading "Creating graph")
        "Submit"))]))
