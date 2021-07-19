(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.components.widgets :as widgets]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.encrypt :as e]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.util :as util]
            [frontend.config :as config]
            [reitit.frontend.easy :as rfe]
            [frontend.version :as version]
            [frontend.components.commit :as commit]
            [frontend.components.svg :as svg]
            [frontend.components.encryption :as encryption]
            [frontend.context.i18n :as i18n]
            [clojure.string :as string]
            [clojure.string :as str]))

(rum/defc add-repo
  [args]
  (if-let [graph-types (get-in args [:query-params :graph-types])]
    (let [graph-types-s (->> (str/split graph-types #",")
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
           (when (nfs-handler/supported?)
             [:div.mr-8
              (ui/button
                (t :open-a-directory)
                :on-click page-handler/ls-dir-files!)])
           (when (and (state/logged?) (not (util/electron?)))
             (ui/button
               "Add another git repo"
               :href (rfe/href :repo-add nil {:graph-types "github"})
               :intent "logseq"))]
          (for [{:keys [id url] :as repo} repos]
            (let [local? (config/local-db? url)]
              [:div.flex.justify-between.mb-1 {:key id}
               (if local?
                 [:a
                  (config/get-local-dir url)]
                 [:a {:target "_blank"
                      :href url}
                  (db/get-repo-path url)])
               [:div.controls
                (when (e/encrypted-db? url)
                  [:a.control {:title "Show encryption information about this graph"
                               :on-click (fn []
                                           (state/set-modal! (encryption/encryption-dialog url)))}
                   "🔐"])
                [:a.control.ml-4 {:title (if local?
                                           "Sync with the local directory"
                                           "Clone again and re-index the db")
                                  :on-click (fn []
                                              (repo-handler/re-index! nfs-handler/rebuild-index!))}
                 "Re-index"]
                [:a.text-gray-400.ml-4 {:title "No worries, unlink this graph will clear its cache only, it does not remove your files on the disk."
                                        :on-click (fn []
                                                    (repo-handler/remove-repo! repo))}
                 "Unlink"]]]))]]
        (widgets/add-graph)))))

(defn refresh-cb []
  (repo-handler/create-today-journal!)
  (shortcut/refresh!))

(rum/defc sync-status < rum/reactive
  {:did-mount (fn [state]
                (js/setTimeout common-handler/check-changed-files-status 1000)
                state)}
  [repo]
  (when repo
    (let [nfs-repo? (config/local-db? repo)]
      (when-not (= repo config/local-repo)
        (if (and nfs-repo? (nfs-handler/supported?))
          (let [syncing? (state/sub :graph/syncing?)]
            [:div.opacity-60.refresh.hover:opacity-100
             [:a.button
              {:on-click #(nfs-handler/refresh! repo refresh-cb)
               :title (str "Import files from the local directory: " (config/get-local-dir repo) ".\nVersion: "
                           version/version)}
              [:div {:class (if syncing? "animate-spin-reverse" "initial")} svg/refresh]]])
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
                  (fn [e]
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
                              {:on-click (fn [e]
                                           (export-handler/download-file! file))}
                              [:span (t :download)]]]])]]
                       :else
                       [:p (t :git/local-changes-synced)])]
                    ;; [:a.text-sm.font-bold {:href "/diff"} "Check diff"]
                    [:div.flex.flex-row.justify-between.align-items.mt-2
                     (ui/button (t :git/push)
                       :on-click (fn [] (state/set-modal! commit/add-commit-message)))
                     (if pushing? svg/loading)]]
                   [:hr]
                   [:div
                    (when-not (string/blank? last-pulled-at)
                      [:p {:style {:font-size 12}} (t :git/last-pull)
                       (str ": " last-pulled-at)])
                    [:div.flex.flex-row.justify-between.align-items
                     (ui/button (t :git/pull)
                       :on-click (fn [] (repo-handler/pull-current-repo)))
                     (if pulling? svg/loading)]
                    [:a.mt-5.text-sm.opacity-50.block
                     {:on-click (fn []
                                  (export-handler/export-repo-as-zip! repo))}
                     (t :repo/download-zip)]
                    [:p.pt-2.text-sm.opacity-50
                     (t :git/version) (str " " version/version)]]])))]))))))

(rum/defc repos-dropdown < rum/reactive
  [on-click]
  (when-let [current-repo (state/sub :git/current-repo)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (let [get-repo-name (fn [repo]
                            (if (config/local-db? repo)
                              (config/get-local-dir repo)
                              (db/get-repo-path repo)))
            repos (state/sub [:me :repos])
            repos (remove (fn [r] (= config/local-repo (:url r))) repos)
            switch-repos (remove (fn [repo]
                                   (= current-repo (:url repo)))
                                 repos)]
        (when (seq repos)
          (ui/dropdown-with-links
           (fn [{:keys [toggle-fn]}]
             [:a#repo-switch.fade-link.block.pr-2.whitespace-nowrap {:on-click toggle-fn}
              [:span
               [:span.repo-plus svg/plus]
               (let [repo-name (get-repo-name current-repo)
                     repo-name (if (util/electron?)
                                 (last (string/split repo-name #"/"))
                                 repo-name)]
                 [:span#repo-name repo-name])
               [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]]])
           (mapv
            (fn [{:keys [id url]}]
              {:title (get-repo-name url)
               :options {:class "ml-1"
                         :on-click (fn []
                                     (repo-handler/push-if-auto-enabled! (state/get-current-repo))
                                     (state/set-current-repo! url)
                                     ;; load config
                                     (common-handler/reset-config! url nil)
                                     (shortcut/refresh!)
                                     (when-not (= :draw (state/get-current-route))
                                       (route-handler/redirect-to-home!))
                                     (when on-click
                                       (on-click url)))}})
            switch-repos)
           (cond->
             {:modal-class (util/hiccup->class
                            "origin-top-right.absolute.left-0.mt-2.w-48.rounded-md.shadow-lg")
              :links-footer [:div
                             (when (seq switch-repos) [:hr.my-4])
                             [:a {:class "block px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link"
                                  :href (rfe/href :repo-add)}
                              (t :new-graph)]
                             [:a {:class "block px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link"
                                  :href (rfe/href :repos)}
                              (t :all-graphs)]
                             [:a {:class "block px-4 py-2 text-sm transition ease-in-out duration-150 cursor menu-link"
                                  :on-click (fn []
                                              (repo-handler/re-index! nfs-handler/rebuild-index!))}
                              (t :re-index)]]}
             (seq switch-repos)
             (assoc :links-header [:div.font-medium.text-sm.opacity-70.px-4.py-2
                                   "Switch to:"]))))))))
