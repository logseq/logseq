(ns frontend.components.repo
  (:require [clojure.string :as string]
            [frontend.common.async-util :as async-util]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.file-based.native-fs :as nfs-handler]
            [frontend.handler.file-sync :as file-sync]
            [frontend.handler.graph :as graph]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc normalized-graph-label
  [{:keys [url remote? GraphName GraphUUID] :as graph} on-click]
  (let [db-based? (config/db-based-graph? url)]
    (when graph
      [:span.flex.items-center
       (if (or (config/local-file-based-graph? url)
               db-based?)
         (let [local-dir (config/get-local-dir url)
               graph-name (text-util/get-graph-name-from-path url)]
           [:a.flex.items-center {:title    local-dir
                                  :on-click #(on-click graph)}
            [:span graph-name (when (and GraphName (not db-based?)) [:strong.pl-1 "(" GraphName ")"])]
            (when remote? [:strong.px-1.flex.items-center (ui/icon "cloud")])])
         [:a.flex.items-center {:title    GraphUUID
                                :on-click #(on-click graph)}
          (db/get-repo-path (or url GraphName))
          (when remote? [:strong.pl-1.flex.items-center (ui/icon "cloud")])])])))

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
        :let [db-based? (config/db-based-graph? url)
              graph-name (if db-based? (config/db-graph-name url) GraphName)]]
    [:div.flex.justify-between.mb-4.items-center.group {:key (or url GraphUUID)
                                                        "data-testid" url}
     [:div
      [:span.flex.items-center.gap-1
       (normalized-graph-label repo
                               (fn []
                                 (when-not (state/sub :rtc/downloading-graph-uuid)
                                   (cond
                                     root ; exists locally
                                     (state/pub-event! [:graph/switch url])

                                     (and db-based? remote?)
                                     (state/pub-event! [:rtc/download-remote-graph GraphName GraphUUID GraphSchemaVersion])

                                     :else
                                     (when-not (util/capacitor-new?)
                                       (state/pub-event! [:graph/pull-down-remote-graph repo]))))))]
      (when-let [time (some-> (or last-seen-at created-at) (safe-locale-date))]
        [:small.text-muted-foreground (str "Last opened at: " time)])]

     [:div.controls
      [:div.flex.flex-row.items-center
       (when (util/electron?)
         [:a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex
          {:on-click #(util/open-url (str "file://" root))}
          (shui/tabler-icon "folder-pin") [:span.pl-1 root]])

       (let [db-graph? (config/db-based-graph? url)
             manager? (and db-graph? (user-handler/manager? url))]
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
                           (let [prompt-str (if db-based?
                                              (str "Are you sure you want to permanently delete the graph \"" graph-name "\" from Logseq?")
                                              (str "Are you sure you want to unlink the graph \"" url "\" from local folder?"))]
                             (-> (shui/dialog-confirm!
                                  [:p.font-medium.-my-4 prompt-str
                                   [:span.my-2.flex.font-normal.opacity-75
                                    (if db-based?
                                      [:small "⚠️ Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."]
                                      [:small "⚠️ It won't remove your local files!"])]])
                                 (p/then (fn []
                                           (repo-handler/remove-repo! repo)
                                           (state/pub-event! [:graph/unlinked repo (state/get-current-repo)]))))))}
              "Delete local graph"))
           (when (and db-based? root
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
                               (state/<invoke-db-worker :thread-api/rtc-async-upload-graph
                                                        repo token remote-graph-name)
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
           (when (and remote? (or (and db-based? manager?) (not db-based?)))
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
                                    (when (or manager? (not db-graph?))
                                      (let [<delete-graph (if db-graph?
                                                            rtc-handler/<rtc-delete-graph!
                                                            (fn [graph-uuid _graph-schema-version]
                                                              (async-util/c->p (file-sync/<delete-graph graph-uuid))))]
                                        (state/set-state! [:file-sync/remote-graphs :loading] true)
                                        (when (= (state/get-current-repo) repo)
                                          (state/<invoke-db-worker :thread-api/rtc-stop))
                                        (p/do! (<delete-graph GraphUUID GraphSchemaVersion)
                                               (state/delete-remote-graph! repo)
                                               (state/set-state! [:file-sync/remote-graphs :loading] false)
                                               (rtc-handler/<get-remote-graphs)))))))))}
              "Delete from server")))))]]]))

(rum/defc repos-cp < rum/reactive
  []
  (let [login? (boolean (state/sub :auth/id-token))
        repos (state/sub [:me :repos])
        repos (util/distinct-by :url repos)
        remotes (concat
                 (state/sub :rtc/graphs)
                 (state/sub [:file-sync/remote-graphs :graphs]))
        remotes-loading? (state/sub [:file-sync/remote-graphs :loading])
        repos (if (and login? (seq remotes))
                (repo-handler/combine-local-&-remote-graphs repos remotes) repos)
        repos (cond->>
               (remove #(= (:url %) config/demo-repo) repos)
                (util/mobile?)
                (filter (fn [item]
                          (config/db-based-graph? (:url item)))))
        {remote-graphs true local-graphs false} (group-by (comp boolean :remote?) repos)]
    [:div#graphs
     (when-not (util/capacitor-new?)
       [:h1.title (t :graph/all-graphs)])

     [:div.pl-1.content.mt-3

      [:div
       [:h2.text-lg.font-medium.my-4 (t :graph/local-graphs)]
       (when (seq local-graphs)
         (repos-inner local-graphs))

       (when-not (util/capacitor-new?)
         [:div.flex.flex-row.my-4
          (if util/web-platform?
            [:div.mr-8
             (ui/button
              "Create a new graph"
              :on-click #(state/pub-event! [:graph/new-db-graph]))]
            (when (or (nfs-handler/supported?)
                      (mobile-util/native-platform?))
              [:div.mr-8
               (ui/button
                (t :open-a-directory)
                :on-click #(state/pub-event! [:graph/setup-a-repo]))]))])]

      (when (and (or (file-sync/enable-sync?)
                     (user-handler/rtc-group?))
                 login?)
        [:div
         [:hr]
         [:div.flex.align-items.justify-between
          [:h2.text-lg.font-medium.my-4 (t :graph/remote-graphs)]
          [:div
           (ui/button
            [:span.flex.items-center "Refresh"
             (when remotes-loading? [:small.pl-2 (ui/loading nil)])]
            :background "gray"
            :disabled remotes-loading?
            :on-click (fn []
                        (when-not (util/capacitor-new?)
                          (file-sync/load-session-graphs))
                        (rtc-handler/<get-remote-graphs)))]]
         (repos-inner remote-graphs)])]]))

(defn- repos-dropdown-links [repos current-repo downloading-graph-id & {:as opts}]
  (let [switch-repos (if-not (nil? current-repo)
                       (remove (fn [repo] (= current-repo (:url repo))) repos) repos) ; exclude current repo
        repo-links (mapv
                    (fn [{:keys [url remote? rtc-graph? GraphName GraphSchemaVersion GraphUUID] :as graph}]
                      (let [local? (config/local-file-based-graph? url)
                            db-only? (config/db-based-graph? url)
                            repo-url (cond
                                       local? (db/get-repo-name url)
                                       db-only? url
                                       :else GraphName)
                            short-repo-name (if (or local? db-only?)
                                              (text-util/get-graph-name-from-path repo-url)
                                              GraphName)
                            downloading? (and downloading-graph-id (= GraphUUID downloading-graph-id))]
                        (when short-repo-name
                          {:title        [:span.flex.items-center.title-wrap short-repo-name
                                          (when remote? [:span.pl-1.flex.items-center
                                                         {:title (str "<" GraphName "> #" GraphUUID)}
                                                         (ui/icon "cloud" {:size 18})
                                                         (when downloading?
                                                           [:span.opacity.text-sm.pl-1 "downloading"])])]
                           :hover-detail repo-url ;; show full path on hover
                           :options      {:on-click
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

(defn- repos-footer [multiple-windows? db-based?]
  [:div.cp__repos-quick-actions
   {:on-click #(shui/popup-hide!)}

   (when (and (not db-based?)
              (not (config/demo-graph?)))
     [:<>
      (shui/button {:size :sm :variant :ghost
                    :title (t :sync-from-local-files-detail)
                    :on-click (fn []
                                (state/pub-event! [:graph/ask-for-re-fresh]))}
                   (shui/tabler-icon "file-report") [:span (t :sync-from-local-files)])

      (shui/button {:size :sm :variant :ghost
                    :title (t :re-index-detail)
                    :on-click (fn []
                                (state/pub-event! [:graph/ask-for-re-index multiple-windows? nil]))}
                   (shui/tabler-icon "folder-bolt") [:span (t :re-index)])])

   (when (util/electron?)
     (shui/button {:size :sm :variant :ghost
                   :on-click (fn []
                               (if (or (nfs-handler/supported?) (mobile-util/native-platform?))
                                 (state/pub-event! [:graph/setup-a-repo])
                                 (route-handler/redirect-to-all-graphs)))}
                  (shui/tabler-icon "folder-plus")
                  [:span (t :new-graph)]))

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
                   :on-click #(route-handler/redirect-to-all-graphs)}
                  (shui/tabler-icon "layout-2") [:span (t :all-graphs)]))])

(rum/defcs repos-dropdown-content < rum/reactive
  [_state & {:keys [contentid] :as opts}]
  (let [multiple-windows? false
        current-repo (state/sub :git/current-repo)
        login? (boolean (state/sub :auth/id-token))
        repos (state/sub [:me :repos])
        remotes (state/sub [:file-sync/remote-graphs :graphs])
        rtc-graphs (state/sub :rtc/graphs)
        downloading-graph-id (state/sub :rtc/downloading-graph-uuid)
        remotes-loading? (state/sub [:file-sync/remote-graphs :loading])
        db-based? (config/db-based-graph? current-repo)
        repos (sort-repos-with-metadata-local repos)
        repos (distinct
               (if (and (or (seq remotes) (seq rtc-graphs)) login?)
                 (repo-handler/combine-local-&-remote-graphs repos (concat remotes rtc-graphs)) repos))
        items-fn #(repos-dropdown-links repos current-repo downloading-graph-id opts)
        header-fn #(when (> (count repos) 1)                ; show switch to if there are multiple repos
                     [:div.font-medium.text-sm.opacity-50.px-1.py-1.flex.flex-row.justify-between.items-center
                      [:h4.pb-1 (t :left-side-bar/switch)]

                      (when (and (file-sync/enable-sync?) login?)
                        (if remotes-loading?
                          (ui/loading "")
                          (shui/button
                           {:variant :ghost
                            :size :sm
                            :title "Refresh remote graphs"
                            :class "!h-6 !px-1 relative right-[-4px]"
                            :on-click (fn []
                                        (file-sync/load-session-graphs)
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
              href' (:href options)]
          (if hr
            (shui/dropdown-menu-separator)
            (shui/dropdown-menu-item
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
     (repos-footer multiple-windows? db-based?)]))

(rum/defcs graphs-selector < rum/reactive
  [_state]
  (let [current-repo (state/get-current-repo)
        user-repos (state/get-repos)
        current-repo' (some->> user-repos (medley/find-first #(= current-repo (:url %))))
        repo-name (when current-repo (db/get-repo-name current-repo))
        db-based? (config/db-based-graph? current-repo)
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
      [:span.thumb (shui/tabler-icon (if remote? "cloud" (if db-based? "topology-star" "folder")) {:size 16})]
      [:strong short-repo-name]
      (shui/tabler-icon "selector" {:size 18})]]))

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
  (or (fs-util/include-reserved-chars? graph-name)
      (string/includes? graph-name "+")
      (string/includes? graph-name "/")))

(rum/defcs new-db-graph < rum/reactive
  (rum/local "" ::graph-name)
  (rum/local false ::cloud?)
  (rum/local false ::creating-db?)
  (rum/local (rum/create-ref) ::input-ref)
  {:did-mount (fn [s]
                (when-let [^js input (some-> @(::input-ref s)
                                             (rum/deref))]
                  (js/setTimeout #(.focus input) 32))
                s)}
  [state]
  (let [*creating-db? (::creating-db? state)
        *graph-name (::graph-name state)
        *cloud? (::cloud? state)
        input-ref @(::input-ref state)
        new-db-f (fn []
                   (when-not (or (string/blank? @*graph-name)
                                 @*creating-db?)
                     (if (invalid-graph-name? @*graph-name)
                       (invalid-graph-name-warning)
                       (do
                         (reset! *creating-db? true)
                         (p/let [repo (repo-handler/new-db! @*graph-name)]
                           (when @*cloud?
                             (->
                              (p/do
                                (state/set-state! :rtc/uploading? true)
                                (rtc-handler/<rtc-create-graph! repo)
                                (rtc-flows/trigger-rtc-start repo)
                                (rtc-handler/<get-remote-graphs))
                              (p/catch (fn [error]
                                         (log/error :create-db-failed error)))
                              (p/finally (fn []
                                           (state/set-state! :rtc/uploading? false)
                                           (reset! *creating-db? false)))))
                           (shui/dialog-close!))))))
        submit! (fn [^js e click?]
                  (when-let [value (and (or click? (= (gobj/get e "key") "Enter"))
                                        (util/trim-safe (.-value (rum/deref input-ref))))]
                    (reset! *graph-name value)
                    (new-db-f)))]
    [:div.new-graph.flex.flex-col.gap-4.p-1.pt-2
     (shui/input
      {:default-value @*graph-name
       :disabled @*creating-db?
       :ref input-ref
       :placeholder "your graph name"
       :on-key-down submit!})
     (when (user-handler/rtc-group?)
       [:div.flex.flex-row.items-center.gap-1
        (shui/checkbox
         {:id "rtc-sync"
          :value @*cloud?
          :on-checked-change #(swap! *cloud? not)})
        [:label.opacity-70.text-sm
         {:for "rtc-sync"}
         "Use Logseq Sync?"]])

     (shui/button
      {:on-click #(submit! % true)
       :on-key-down submit!}
      (if @*creating-db?
        (ui/loading "Creating graph")
        "Submit"))]))
