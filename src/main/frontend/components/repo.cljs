(ns frontend.components.repo
  (:require [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.web.nfs :as nfs-handler]
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
            [reitit.frontend.easy :as rfe]))

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

(rum/defc repos-inner
  "Graph list in `All graphs` page"
  [repos]
  (for [{:keys [url remote? GraphUUID GraphName] :as repo} repos
        :let [only-cloud? (and remote? (nil? url))
              db-based? (config/db-based-graph? url)]]
    [:div.flex.justify-between.mb-4.items-center {:key (or url GraphUUID)}
     (normalized-graph-label repo #(if only-cloud?
                                     (state/pub-event! [:graph/pull-down-remote-graph repo])
                                     (state/pub-event! [:graph/switch url])))

     [:div.controls
      [:div.flex.flex-row.items-center
       (ui/tippy {:html [:div.text-sm.max-w-xs
                         (cond
                           only-cloud?
                           "Deletes this remote graph. Note this can't be recovered."

                           db-based?
                           "Unsafe delete this DB-based graph. Note this can't be recovered."

                           :else
                           "Removes Logseq's access to the local file path of your graph. It won't remove your local files.")]
                  :class "tippy-hover"
                  :interactive true}
                 [:a.text-gray-400.ml-4.font-medium.text-sm.whitespace-nowrap
                  {:on-click (fn []
                               (let [has-prompt? (or only-cloud? db-based?)
                                     prompt-str (cond only-cloud?
                                                      (str "Are you sure to permanently delete the graph \"" GraphName "\" from our server?")
                                                      db-based?
                                                      (str "Are you sure to permanently delete the graph \"" url "\" from Logseq?")
                                                      :else
                                                      "")
                                     unlink-or-remote-fn (fn []
                                                           (let [current-repo (state/get-current-repo)]
                                                             (repo-handler/remove-repo! repo)
                                                             (state/pub-event! [:graph/unlinked repo current-repo])))
                                     action-confirm-fn (if only-cloud?
                                                         (fn []
                                                           (state/set-state! [:file-sync/remote-graphs :loading] true)
                                                           (go (<! (file-sync/<delete-graph GraphUUID))
                                                               (state/delete-repo! repo)
                                                               (state/delete-remote-graph! repo)
                                                               (state/set-state! [:file-sync/remote-graphs :loading] false)))
                                                         unlink-or-remote-fn)
                                     confirm-fn
                                     (fn []
                                       (ui/make-confirm-modal
                                        {:title      [:div
                                                      {:style {:max-width 700}}
                                                      prompt-str]
                                         :sub-title   [:div.small.mt-1
                                                       "Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."]
                                         :on-confirm (fn [_ {:keys [close-fn]}]
                                                       (close-fn)
                                                       (action-confirm-fn))}))]
                                 (if has-prompt?
                                   (state/set-modal! (confirm-fn))
                                   (unlink-or-remote-fn))))}
                  (if (or db-based? only-cloud?) "Remove" "Unlink")])]]]))

(rum/defc repos < rum/reactive
  []
  (let [login? (boolean (state/sub :auth/id-token))
        repos (state/sub [:me :repos])
        repos (util/distinct-by :url repos)
        remotes (state/sub [:file-sync/remote-graphs :graphs])
        remotes-loading? (state/sub [:file-sync/remote-graphs :loading])
        repos (if (and login? (seq remotes))
                (repo-handler/combine-local-&-remote-graphs repos remotes) repos)
        repos (remove #(= (:url %) config/local-repo) repos)
        {remote-graphs true local-graphs false} (group-by (comp boolean :remote?) repos)]
    (if (seq repos)
      [:div#graphs
       [:h1.title (t :graph/all-graphs)]

       [:div.pl-1.content.mt-3

        [:div
         [:h2.text-lg.font-medium.my-4 (t :graph/local-graphs)]
         (when (seq local-graphs)
           (repos-inner local-graphs))

         [:div.flex.flex-row.my-4
          (when (or (nfs-handler/supported?)
                    (mobile-util/native-platform?))
            [:div.mr-8
             (ui/button
               (t :open-a-directory)
               :on-click #(state/pub-event! [:graph/setup-a-repo]))])]]

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
              :on-click #(file-sync/load-session-graphs))]]
           (repos-inner remote-graphs)])]]
      (widgets/add-graph))))

(defn- check-multiple-windows?
  [state]
  (when (util/electron?)
    (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" (state/get-current-repo))]
      (reset! (::electron-multiple-windows? state) multiple-windows?))))

(defn- repos-dropdown-links [repos current-repo *multiple-windows?]
  (let [switch-repos (if-not (nil? current-repo)
                       (remove (fn [repo] (= current-repo (:url repo))) repos) repos) ; exclude current repo
        repo-links (mapv
                    (fn [{:keys [url remote? GraphName GraphUUID] :as graph}]
                      (let [local? (config/local-file-based-graph? url)
                            db-only? (config/db-based-graph? url)
                            repo-url (cond
                                       local? (db/get-repo-name url)
                                       db-only? url
                                       :else GraphName)
                            short-repo-name (if (or local? db-only?)
                                              (text-util/get-graph-name-from-path repo-url)
                                              GraphName)]
                        (when short-repo-name
                          {:title        [:span.flex.items-center.whitespace-nowrap short-repo-name
                                          (when remote? [:span.pl-1.flex.items-center
                                                         {:title (str "<" GraphName "> #" GraphUUID)}
                                                         (ui/icon "cloud" {:size 18})])]
                           :hover-detail repo-url ;; show full path on hover
                           :options      {:on-click (fn [e]
                                                      (if (gobj/get e "shiftKey")
                                                        (state/pub-event! [:graph/open-new-window url])
                                                        (if (or local? db-only?)
                                                          (state/pub-event! [:graph/switch url])
                                                          (state/pub-event! [:graph/pull-down-remote-graph graph]))))}})))
                    switch-repos)
        refresh-link (let [nfs-repo? (config/local-file-based-graph? current-repo)]
                       (when (and nfs-repo?
                                  (not= current-repo config/local-repo)
                                  (or (nfs-handler/supported?)
                                      (mobile-util/native-platform?)))
                         {:title (t :sync-from-local-files)
                          :hover-detail (t :sync-from-local-files-detail)
                          :options {:on-click #(state/pub-event! [:graph/ask-for-re-fresh])}}))
        reindex-link {:title        (t :re-index)
                      :hover-detail (t :re-index-detail)
                      :options (cond->
                                 {:on-click
                                  (fn []
                                    (state/pub-event! [:graph/ask-for-re-index *multiple-windows? nil]))})}
        new-window-link (when (and (util/electron?)
                                   ;; New Window button in menu bar of macOS is available.
                                   (not util/mac?))
                          {:title        (t :open-new-window)
                           :options {:on-click #(state/pub-event! [:graph/open-new-window nil])}})]
    (->>
     (concat repo-links
             [(when (seq repo-links) {:hr true})
              (if (or (nfs-handler/supported?) (mobile-util/native-platform?))
                {:title (t :new-graph) :options {:on-click #(state/pub-event! [:graph/setup-a-repo])}}
                {:title (t :new-graph) :options {:href (rfe/href :repos)}}) ;; Brings to the repos page for showing fallback message
              (when config/db-graph-enabled?
                {:title (str (t :new-graph) " - DB version")
                :options {:on-click #(state/pub-event! [:graph/new-db-graph])}})
              {:title (t :all-graphs) :options {:href (rfe/href :repos)}}
              refresh-link
              (when-not (config/db-based-graph? current-repo)
                reindex-link)
              new-window-link])
     (remove nil?))))

(rum/defcs repos-dropdown < rum/reactive
  (rum/local false ::electron-multiple-windows?)
  [state]
  (let [multiple-windows? (::electron-multiple-windows? state)
        current-repo (state/sub :git/current-repo)
        login? (boolean (state/sub :auth/id-token))
        remotes-loading? (state/sub [:file-sync/remote-graphs :loading])]
    (when (or login? current-repo)
      (let [repos (state/sub [:me :repos])
            remotes (state/sub [:file-sync/remote-graphs :graphs])
            repos (if (and (seq remotes) login?)
                    (repo-handler/combine-local-&-remote-graphs repos remotes) repos)
            links (repos-dropdown-links repos current-repo multiple-windows?)
            render-content (fn [{:keys [toggle-fn]}]
                             (let [remote? (:remote? (first (filter #(= current-repo (:url %)) repos)))
                                   repo-name (db/get-repo-name current-repo)
                                   short-repo-name (if repo-name
                                                     (db/get-short-repo-name repo-name)
                                                     "Select a Graph")]
                               [:a.item.group.flex.items-center.p-2.text-sm.font-medium.rounded-md

                                {:on-click (fn []
                                             (check-multiple-windows? state)
                                             (toggle-fn))
                                 :title    repo-name}       ;; show full path on hover
                                [:div.flex.flex-row.items-center
                                 [:div.flex.relative.graph-icon.rounded
                                  (let [icon "database"
                                        opts {:size 14}]
                                    (ui/icon icon opts))]

                                 [:div.graphs
                                  [:span#repo-switch.block.pr-2.whitespace-nowrap
                                   [:span [:span#repo-name.font-medium
                                           [:span.overflow-hidden.text-ellipsis (if (= config/local-repo short-repo-name) "Demo" short-repo-name)]
                                           (when remote? [:span.pl-1 (ui/icon "cloud")])]]
                                   [:span.dropdown-caret.ml-2 {:style {:border-top-color "#6b7280"}}]]]]]))
            links-header (cond->
                          {:z-index 1000
                           :modal-class (util/hiccup->class
                                         "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg")}
                           (> (count repos) 1)              ; show switch to if there are multiple repos
                           (assoc :links-header [:div.font-medium.text-sm.opacity-70.px-4.pt-2.pb-1.flex.flex-row.justify-between.items-center
                                                 [:div (t :left-side-bar/switch)]
                                                 (when (and (file-sync/enable-sync?) login?)
                                                   (if remotes-loading?
                                                     (ui/loading "")
                                                     [:a.flex {:title "Refresh remote graphs"
                                                               :on-click file-sync/load-session-graphs}
                                                      (ui/icon "refresh")]))]))]
        (when (seq repos)
          (ui/dropdown-with-links render-content links links-header))))))

(rum/defcs new-db-graph <
  (rum/local "" ::graph-name)
  [state]
  (let [*graph-name (::graph-name state)
        new-db-f (fn []
                   (when-not (string/blank? @*graph-name)
                     (repo-handler/new-db! @*graph-name)
                     (state/close-modal!)))]
    [:div.new-graph.p-4
     [:h1.title "Create new graph: "]
     [:input.form-input.mb-4 {:value @*graph-name
                              :auto-focus true
                              :on-change #(reset! *graph-name (util/evalue %))
                              :on-key-down   (fn [^js e]
                                               (when (= (gobj/get e "key") "Enter")
                                                 (new-db-f)))}]
     (ui/button "Submit"
       :on-click new-db-f
       :on-key-down   (fn [^js e]
                        (when (= (gobj/get e "key") "Enter")
                          (new-db-f))))]))
