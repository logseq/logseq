(ns frontend.components.repo
  (:require [clojure.string :as string]
            [frontend.components.commit :as commit]
            [frontend.components.encryption :as encryption]
            [frontend.components.svg :as svg]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.encrypt :as e]
            [frontend.handler.common :as common-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.fs :as fs]
            [frontend.version :as version]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]
            [frontend.text :as text]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

(defn- open-repo-url [url]
  (repo-handler/push-if-auto-enabled! (state/get-current-repo))
  (state/set-current-repo! url)
  ;; load config
  (common-handler/reset-config! url nil)
  (shortcut/refresh!)
  (when-not (= :draw (state/get-current-route))
    (route-handler/redirect-to-home!))
  (when-let [dir-name (config/get-repo-dir url)]
    (fs/watch-dir! dir-name)))

(rum/defc add-repo
  [args]
  (if-let [graph-types (get-in args [:query-params :graph-types])]
    (let [graph-types-s (->> (string/split graph-types #",")
                             (mapv keyword))]
      (when (seq graph-types-s)
        (widgets/add-graph :graph-types graph-types-s)))
    (widgets/add-graph)))

(rum/defc repos < rum/reactive
  []
  (let [repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))
        repos (util/distinct-by :url repos)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (if (seq repos)
        [:div#graphs
         [:h1.title "All Graphs"]
         [:p.ml-2.opacity-70
          (if (state/github-authed?)
            "A \"graph\" in Logseq could be either a local directory or a git repo."
            "A \"graph\" in Logseq means a local directory.")]

         [:div.pl-1.content.mt-3
          [:div.flex.flex-row.my-4
           (when (or (nfs-handler/supported?)
                     (mobile-util/is-native-platform?))
             [:div.mr-8
              (ui/button
                (t :open-a-directory)
                :on-click #(page-handler/ls-dir-files! shortcut/refresh!))])
           (when (and (state/logged?) (not (util/electron?)))
             (ui/button
               "Add another git repo"
               :href (rfe/href :repo-add nil {:graph-types "github"})
               :intent "logseq"))]
          (for [{:keys [id url] :as repo} repos]
            (let [local? (config/local-db? url)]
              [:div.flex.justify-between.mb-4 {:key id}
               (if local?
                 (let [local-dir (config/get-local-dir url)
                       graph-name (text/get-graph-name-from-path local-dir)]
                   [:a {:title local-dir
                        :on-click #(open-repo-url url)}
                    graph-name])
                 [:a {:target "_blank"
                      :href url}
                  (db/get-repo-path url)])
               [:div.controls
                (when (e/encrypted-db? url)
                  [:a.control {:title "Show encryption information about this graph"
                               :on-click (fn []
                                           (state/set-modal! (encryption/encryption-dialog url)))}
                   "🔐"])
                [:a.text-gray-400.ml-4.font-medium.text-sm
                 {:title "No worries, unlink this graph will clear its cache only, it does not remove your files on the disk."
                  :on-click (fn []
                              (repo-handler/remove-repo! repo))}
                 "Unlink"]]]))]]
        (widgets/add-graph)))))

(defn refresh-cb []
  (page-handler/create-today-journal!)
  (shortcut/refresh!))

(rum/defc sync-status < rum/reactive
  {:did-mount (fn [state]
                (js/setTimeout common-handler/check-changed-files-status 1000)
                state)}
  [repo]
  (when (and repo
             (string/starts-with? repo "https://"))
    (let [changed-files (state/sub [:repo/changed-files repo])
          should-push? (seq changed-files)
          git-status (state/sub [:git/status repo])
          pushing? (= :pushing git-status)
          pulling? (= :pulling git-status)
          git-failed? (contains?
                       #{:push-failed
                         :clone-failed
                         :checkout-failed
                         :fetch-failed
                         :merge-failed}
                       git-status)
          push-failed? (= :push-failed git-status)
          last-pulled-at (db/sub-key-value repo :git/last-pulled-at)
          ;; db-persisted? (state/sub [:db/persisted? repo])
          editing? (seq (state/sub :editor/editing?))]
      [:div.flex-row.flex.items-center.cp__repo-indicator
       (when pushing? svg/loading)
       (ui/dropdown
        (fn [{:keys [toggle-fn]}]
          [:div.cursor.w-2.h-2.sync-status.mr-2
           {:class (cond
                     git-failed?
                     "bg-red-500"
                     (or
                      ;; (not db-persisted?)
                      editing?
                      should-push? pushing?)
                     "bg-orange-400"
                     :else
                     "bg-green-600")
            :style {:border-radius "50%"
                    :margin-top 2}
            :on-mouse-over
            (fn [_e]
              (toggle-fn)
              (js/setTimeout common-handler/check-changed-files-status 0))}])
        (fn [{:keys [toggle-fn]}]
          (rum/with-context [[t] i18n/*tongue-context*]
            [:div.p-2.rounded-md.shadow-xs.bg-base-3.flex.flex-col.sync-content
             {:on-mouse-leave toggle-fn}
             [:div
              [:div
               (cond
                 push-failed?
                 [:p (t :git/push-failed)]
                 (and should-push? (seq changed-files))
                 [:div.changes
                  [:ul.overflow-y-auto {:style {:max-height 250}}
                   (for [file changed-files]
                     [:li {:key (str "sync-" file)}
                      [:div.flex.flex-row.justify-between.align-items
                       [:a {:href (rfe/href :file {:path file})}
                        file]
                       [:a.ml-4.text-sm.mt-1
                        {:on-click (fn [_e]
                                     (export-handler/download-file! file))}
                        [:span (t :download)]]]])]]
                 :else
                 [:p (t :git/local-changes-synced)])]
              ;; [:a.text-sm.font-bold {:href "/diff"} "Check diff"]
              [:div.flex.flex-row.justify-between.align-items.mt-2
               (ui/button (t :git/push)
                 :on-click (fn [] (state/set-modal! commit/add-commit-message)))
               (when pushing? svg/loading)]]
             [:hr]
             [:div
              (when-not (string/blank? last-pulled-at)
                [:p {:style {:font-size 12}} (t :git/last-pull)
                 (str ": " last-pulled-at)])
              [:div.flex.flex-row.justify-between.align-items
               (ui/button (t :git/pull)
                 :on-click (fn [] (repo-handler/pull-current-repo)))
               (when pulling? svg/loading)]
              [:a.mt-5.text-sm.opacity-50.block
               {:on-click (fn []
                            (export-handler/export-repo-as-zip! repo))}
               (t :repo/download-zip)]
              [:p.pt-2.text-sm.opacity-50
               (t :git/version) (str " " version/version)]]])))])))

(defn- check-multiple-windows?
  [state]
  (when (util/electron?)
    (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" (state/get-current-repo))]
      (reset! (::electron-multiple-windows? state) multiple-windows?))))

(rum/defcs repos-dropdown < rum/reactive
  (rum/local false ::electron-multiple-windows?)
  [state]
  (let [multiple-windows? (::electron-multiple-windows? state)]
    (when-let [current-repo (state/sub :git/current-repo)]
      (rum/with-context [[t] i18n/*tongue-context*]
        (let [get-repo-name (fn [repo]
                              (cond
                                (mobile-util/is-native-platform?)
                                (text/get-graph-name-from-path repo)

                                (config/local-db? repo)
                                (config/get-local-dir repo)

                                :else
                                (db/get-repo-path repo)))
              repos (state/sub [:me :repos])
              repos (remove (fn [r] (= config/local-repo (:url r))) repos)
              switch-repos (remove (fn [repo]
                                     (= current-repo (:url repo)))
                                   repos)
              repo-links (mapv
                          (fn [{:keys [url]}]
                            (let [repo-path (get-repo-name url)
                                  short-repo-name (text/get-graph-name-from-path repo-path)]
                              {:title short-repo-name
                               :hover-detail repo-path ;; show full path on hover
                               :options {:class "ml-1"
                                         :on-click #(open-repo-url url)}}))
                          switch-repos)
              links (->>
                     (concat repo-links
                             [(when (seq switch-repos)
                                {:hr true})
                              {:title (t :new-graph)
                               :options {:href (rfe/href :repo-add)}}
                              {:title (t :all-graphs)
                               :options {:href (rfe/href :repos)}}
                              (let [nfs-repo? (config/local-db? current-repo)]
                                (when (and nfs-repo?
                                           (not= current-repo config/local-repo)
                                           (or (nfs-handler/supported?)
                                               (mobile-util/is-native-platform?)))
                                  {:title (t :sync-from-local-files)
                                   :hover-detail (t :sync-from-local-files-detail)
                                   :options {:on-click
                                             (fn []
                                               (state/pub-event!
                                                [:modal/show
                                                 [:div {:style {:max-width 700}}
                                                  [:p "Refresh detects and processes files modified on your disk and diverged from the actual Logseq page content. Continue?"]
                                                  (ui/button
                                                    "Yes"
                                                    :autoFocus "on"
                                                    :large? true
                                                    :on-click (fn []
                                                                (state/close-modal!)
                                                                (nfs-handler/refresh! (state/get-current-repo) refresh-cb)))]]))}}))
                              {:title        (t :re-index)
                               :hover-detail (t :re-index-detail)
                               :options (cond->
                                          {:on-click
                                           (fn []
                                             (if @multiple-windows?
                                               (state/pub-event!
                                                [:modal/show
                                                 [:div
                                                  [:p "You need to close the other windows before re-index this graph."]]])
                                               (state/pub-event!
                                                [:modal/show
                                                 [:div {:style {:max-width 700}}
                                                  [:p "Re-index will discard the current graph, and then processes all the files again as they are currently stored on disk. You will lose unsaved changes and it might take a while. Continue?"]
                                                  (ui/button
                                                    "Yes"
                                                    :autoFocus "on"
                                                    :large? true
                                                    :on-click (fn []
                                                                (state/close-modal!)
                                                                (repo-handler/re-index!
                                                                 nfs-handler/rebuild-index!
                                                                 page-handler/create-today-journal!)))]])))})}
                              (when (util/electron?)
                                {:title        (t :open-new-window)
                                 :options {:on-click ui-handler/open-new-window!}})])
                     (remove nil?))]
          (when (seq repos)
            (ui/dropdown-with-links
             (fn [{:keys [toggle-fn]}]
               (let [repo-path (get-repo-name current-repo)
                     short-repo-name (if (or (util/electron?)
                                             (mobile-util/is-native-platform?))
                                       (text/get-file-basename repo-path)
                                       repo-path)]
                 [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md
                  {:on-click (fn []
                               (check-multiple-windows? state)
                               (toggle-fn))
                   :title repo-path} ;; show full path on hover
                  (ui/icon "database mr-3" {:style {:font-size 20} :id "database-icon"})
                  [:div.graphs
                   [:span#repo-switch.block.pr-2.whitespace-nowrap
                    [:span [:span#repo-name.font-medium short-repo-name]]
                    [:span.dropdown-caret.ml-2 {:style {:border-top-color "#6b7280"}}]]]]))
             links
             (cond->
               {:modal-class (util/hiccup->class
                              "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg")}
               (seq switch-repos)
               (assoc :links-header [:div.font-medium.text-sm.opacity-60.px-4.pt-2
                                     "Switch to:"])))))))))
