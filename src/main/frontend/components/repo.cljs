(ns frontend.components.repo
  (:require [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]
            [frontend.util.text :as text-util]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [goog.object :as gobj]
            [cljs.core.async :as async :refer [go <!]]
            [clojure.string :as string]
            [frontend.handler.file-sync :as file-sync]
            [frontend.handler.notification :as notification]
            [frontend.util.fs :as fs-util]
            [frontend.handler.user :as user-handler]
            [logseq.shui.ui :as shui]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.graph :as graph]
            [frontend.common.async-util :as async-util]))

(rum/defc normalized-graph-label
  [{:keys [url remote? GraphName GraphUUID] :as graph} on-click]
  (when graph
    [:span.flex.items-center
     (if (or (config/local-file-based-graph? url)
             (config/db-based-graph? url))
       (let [local-dir (config/get-local-dir url)
             graph-name (text-util/get-graph-name-from-path url)]
         [:a.flex.items-center {:title    local-dir
                                :on-click #(on-click graph)}
          [:span graph-name (when GraphName [:strong.px-1 "(" GraphName ")"])]
          (when remote? [:strong.pr-1.flex.items-center (ui/icon "cloud")])])

       [:a.flex.items-center {:title    GraphUUID
                              :on-click #(on-click graph)}
        (db/get-repo-path (or url GraphName))
        (when remote? [:strong.pl-1.flex.items-center (ui/icon "cloud")])])]))

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

(rum/defc repos-inner
  "Graph list in `All graphs` page"
  [repos]
  (for [{:keys [root url remote? GraphUUID GraphName created-at last-seen-at] :as repo}
        (sort-repos-with-metadata-local repos)
        :let [only-cloud? (and remote? (nil? root))
              db-based? (config/db-based-graph? url)]]
    [:div.flex.justify-between.mb-4.items-center.group {:key (or url GraphUUID)}
     [:div
      [:span.flex.items-center.gap-1
       (normalized-graph-label repo
         (fn []
           (when-not (state/sub :rtc/downloading-graph-uuid)
             (cond
               root                                         ; exists locally
               (state/pub-event! [:graph/switch url])

               (and db-based? remote?)
               (state/pub-event! [:rtc/download-remote-graph GraphName GraphUUID])

               :else
               (state/pub-event! [:graph/pull-down-remote-graph repo])))))]
      (when-let [time (some-> (or last-seen-at created-at) (safe-locale-date))]
        [:small.text-gray-400.opacity-50 (str "Last opened at: " time)])]

     [:div.controls
      [:div.flex.flex-row.items-center
       (when (util/electron?)
         [:a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex
          {:on-click #(util/open-url (str "file://" root))}
          (shui/tabler-icon "folder-pin") [:span.pl-1 root]])

       (let [db-graph? (config/db-based-graph? url)
             manager? (and db-graph? (user-handler/manager? url))
             title (cond
                     only-cloud?
                     "Deletes this remote graph. Note this can't be recovered."

                     db-based?
                     "Unsafe delete this DB-based graph. Note this can't be recovered."

                     :else
                     "Removes Logseq's access to the local file path of your graph. It won't remove your local files.")]
         (when-not (and only-cloud? (not manager?))
           [:a.text-gray-400.ml-4.font-medium.text-sm.whitespace-nowrap
            {:title title
             :on-click (fn []
                         (let [has-prompt? true
                               prompt-str (cond only-cloud?
                                            (str "Are you sure to permanently delete the graph \"" GraphName "\" from our server?")
                                            db-based?
                                            (str "Are you sure to permanently delete the graph \"" url "\" from Logseq?")
                                            :else
                                            (str "Are you sure to unlink the graph \"" url "\" from local folder?"))
                               unlink-or-remote-fn! (fn []
                                                      (repo-handler/remove-repo! repo)
                                                      (state/pub-event! [:graph/unlinked repo (state/get-current-repo)]))
                               action-confirm-fn! (if only-cloud?
                                                    (fn []
                                                      (when (or manager? (not db-graph?))
                                                        (let [delete-graph (if db-graph?
                                                                             rtc-handler/<rtc-delete-graph!
                                                                             file-sync/<delete-graph)]
                                                          (state/set-state! [:file-sync/remote-graphs :loading] true)
                                                          (go (<! (delete-graph GraphUUID))
                                                            (state/delete-repo! repo)
                                                            (state/delete-remote-graph! repo)
                                                            (state/set-state! [:file-sync/remote-graphs :loading] false)))))
                                                    unlink-or-remote-fn!)
                               confirm-fn!
                               (fn []
                                 (-> (shui/dialog-confirm!
                                       [:p.font-medium.-my-4 prompt-str
                                        [:span.mt-1.flex.font-normal.opacity-70
                                         (if (or db-based? only-cloud?)
                                           [:small.text-red-rx-11 "⚠️ Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."]
                                           [:small.opacity-70 "⚠️ It won't remove your local files!"])]])
                                   (p/then #(action-confirm-fn!))))]

                           (if has-prompt?
                             (confirm-fn!)
                             (unlink-or-remote-fn!))))}
            (if only-cloud? "Remove (server)" "Unlink (local)")]))]]]))

(rum/defc repos < rum/reactive
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
        repos (remove #(= (:url %) config/demo-repo) repos)
        {remote-graphs true local-graphs false} (group-by (comp boolean :remote?) repos)]
    [:div#graphs
     [:h1.title (t :graph/all-graphs)]

     [:div.pl-1.content.mt-3

      [:div
       [:h2.text-lg.font-medium.my-4 (t :graph/local-graphs)]
       (when (seq local-graphs)
         (repos-inner local-graphs))

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
              :on-click #(state/pub-event! [:graph/setup-a-repo]))]))]]

      (when (and (file-sync/enable-sync?) login?)
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
                        (file-sync/load-session-graphs)
                        (rtc-handler/<get-remote-graphs)))]]
         (repos-inner remote-graphs)])]]))

(defn- check-multiple-windows?
  [state]
  (when (util/electron?)
    (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" (state/get-current-repo))]
      (reset! (::electron-multiple-windows? state) multiple-windows?))))

(defn- repos-dropdown-links [repos current-repo downloading-graph-id & {:as opts}]
  (let [switch-repos (if-not (nil? current-repo)
                       (remove (fn [repo] (= current-repo (:url repo))) repos) repos) ; exclude current repo
        repo-links (mapv
                    (fn [{:keys [url remote? rtc-graph? GraphName GraphUUID] :as graph}]
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
                           :options      {:on-click (fn [e]
                                                      (when-not downloading?
                                                        (when-let [on-click (:on-click opts)]
                                                          (on-click e))
                                                        (if (and (gobj/get e "shiftKey")
                                                                 (not (and rtc-graph? remote?)))
                                                          (state/pub-event! [:graph/open-new-window url])
                                                          (cond
                                                            (:root graph) ; exists locally
                                                            (state/pub-event! [:graph/switch url])

                                                            (and rtc-graph? remote?)
                                                            (state/pub-event! [:rtc/download-remote-graph GraphName GraphUUID])

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

   (shui/button {:size :sm :variant :ghost
                 :on-click #(state/pub-event! [:graph/new-db-graph])}
     (shui/tabler-icon "database-plus") [:span (if util/electron? "Create db graph" "Create new graph")])

   (shui/button {:size :sm :variant :ghost
                 :on-click (fn [] (route-handler/redirect! {:to :import}))}
                (shui/tabler-icon "database-import")
                [:span (t :import-notes)])

   (shui/button {:size :sm :variant :ghost
                 :on-click #(route-handler/redirect-to-all-graphs)}
                (shui/tabler-icon "layout-2") [:span (t :all-graphs)])])

(rum/defcs repos-dropdown < rum/reactive
  (rum/local false ::electron-multiple-windows?)
  [state & {:as opts}]
  (let [multiple-windows? (::electron-multiple-windows? state)
        current-repo (state/sub :git/current-repo)
        login? (boolean (state/sub :auth/id-token))
        remotes-loading? (state/sub [:file-sync/remote-graphs :loading])]
    (let [repos (state/sub [:me :repos])
          remotes (state/sub [:file-sync/remote-graphs :graphs])
          rtc-graphs (state/sub :rtc/graphs)
          downloading-graph-id (state/sub :rtc/downloading-graph-uuid)
          db-based? (config/db-based-graph? current-repo)
          repos (sort-repos-with-metadata-local repos)
          repos (distinct
                 (if (and (or (seq remotes) (seq rtc-graphs)) login?)
                   (repo-handler/combine-local-&-remote-graphs repos (concat remotes rtc-graphs)) repos))
          items-fn #(repos-dropdown-links repos current-repo downloading-graph-id opts)
          header-fn #(when (> (count repos) 1)              ; show switch to if there are multiple repos
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
                             (ui/icon "refresh" {:size 15}))))])]
      (let [remote? (and current-repo (:remote? (first (filter #(= current-repo (:url %)) repos))))
            repo-name (when current-repo (db/get-repo-name current-repo))
            short-repo-name (if current-repo
                              (db/get-short-repo-name repo-name)
                              "Select a Graph")]
        (shui/trigger-as :a
                         {:tab-index 0
                          :class "item cp__repos-select-trigger"
                          :on-pointer-down
                          (fn [^js e]
                            (check-multiple-windows? state)
                            (some-> (.-target e)
                                    (.closest "a.item")
                                    (shui/popup-show!
                                     (fn [{:keys [id]}]
                                       [:<>
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
                                                                       (shui/popup-hide! id)))))
                                                (or item
                                                    (if href'
                                                      [:a.flex.items-center.w-full
                                                       {:href href' :on-click #(shui/popup-hide! id)
                                                        :style {:color "inherit"}} title]
                                                      [:span.flex.items-center.gap-1.w-full
                                                       icon [:div title]]))))))]
                                        (repos-footer multiple-windows? db-based?)])
                                     {:as-dropdown? true
                                      :auto-focus? false
                                      :align "start"
                                      :content-props {:class (str "repos-list " (when (<= (count repos) 1) " no-repos"))
                                                      :data-mode (when db-based? "db")}})))
                          :title repo-name}                              ;; show full path on hover
                         [:div.flex.relative.graph-icon.rounded
                          (shui/tabler-icon "database" {:size 15})]

                         [:div.repo-switch.pr-2.whitespace-nowrap
                          [:span.repo-name.font-medium
                           [:span.repo-text.overflow-hidden.text-ellipsis
                            (if (config/demo-graph? short-repo-name) "Demo" short-repo-name)]
                           (when remote? [:span.pl-1 (ui/icon "cloud")])]
                          [:span.dropdown-caret]])))))

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
    (string/includes? graph-name "+")))

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
                              (p/do!
                               (state/set-state! :rtc/uploading? true)
                               (async-util/c->p (rtc-handler/<rtc-create-graph! repo))
                               (state/set-state! :rtc/uploading? false)
                                ;; No need to wait for rtc-start since it's a go loop that'll
                                ;; return a value once it's stopped
                               (and (rtc-handler/<rtc-start! repo) false))
                              (p/catch (fn [error]
                                         (reset! *creating-db? false)
                                         (state/set-state! :rtc/uploading? false)
                                         (prn :debug :create-db-failed)
                                         (js/console.error error)))))
                           (reset! *creating-db? false)
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
     (when (user-handler/logged-in?)
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
