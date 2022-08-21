(ns frontend.components.repo
  (:require [clojure.string :as string]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]
            [frontend.util.text :as text-util]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [goog.object :as gobj]
            [frontend.components.encryption :as encryption]
            [frontend.encrypt :as e]))

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
    (if (seq repos)
      [:div#graphs
       [:h1.title (t :all-graphs)]
       [:p.ml-2.opacity-70
        "A \"graph\" in Logseq means a local directory."]

       [:div.pl-1.content.mt-3
        [:div.flex.flex-row.my-4
         (when (or (nfs-handler/supported?)
                   (mobile-util/native-platform?))
           [:div.mr-8
            (ui/button
              (t :open-a-directory)
              :on-click #(page-handler/ls-dir-files! shortcut/refresh!))])]
        (for [{:keys [url] :as repo} repos]
          (let [local? (config/local-db? url)]
            [:div.flex.justify-between.mb-4 {:key (str "id-" url)}
             (if local?
               (let [local-dir (config/get-local-dir url)
                     graph-name (text-util/get-graph-name-from-path local-dir)]
                 [:a {:title local-dir
                      :on-click #(state/pub-event! [:graph/switch url])}
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
               (t :unlink)]]]))]]
      (widgets/add-graph))))

(defn refresh-cb []
  (page-handler/create-today-journal!)
  (shortcut/refresh!))

(defn- check-multiple-windows?
  [state]
  (when (util/electron?)
    (p/let [multiple-windows? (ipc/ipc "graphHasMultipleWindows" (state/get-current-repo))]
      (reset! (::electron-multiple-windows? state) multiple-windows?))))

(defn- repos-dropdown-links [repos current-repo *multiple-windows?]
  (let [switch-repos (remove (fn [repo] (= current-repo (:url repo))) repos) ; exclude current repo
        repo-links (mapv
                    (fn [{:keys [url]}]
                      (let [repo-path (db/get-repo-name url)
                            short-repo-name (text-util/get-graph-name-from-path repo-path)]
                        {:title short-repo-name
                         :hover-detail repo-path ;; show full path on hover
                         :options {:class "ml-1"
                                   :on-click (fn [e]
                                               (if (gobj/get e "shiftKey")
                                                 (state/pub-event! [:graph/open-new-window url])
                                                 (state/pub-event! [:graph/switch url])))}}))
                    switch-repos)
        refresh-link (let [nfs-repo? (config/local-db? current-repo)]
                       (when (and nfs-repo?
                                  (not= current-repo config/local-repo)
                                  (or (nfs-handler/supported?)
                                      (mobile-util/native-platform?)))
                         {:title (t :sync-from-local-files)
                          :hover-detail (t :sync-from-local-files-detail)
                          :options {:on-click
                                    (fn []
                                      (state/pub-event!
                                       [:modal/show
                                        [:div {:style {:max-width 700}}
                                         [:p (t :sync-from-local-changes-detected)]
                                         (ui/button
                                          (t :yes)
                                          :autoFocus "on"
                                          :large? true
                                          :on-click (fn []
                                                      (state/close-modal!)
                                                      (nfs-handler/refresh! (state/get-current-repo) refresh-cb)))]]))}}))
        reindex-link {:title        (t :re-index)
                      :hover-detail (t :re-index-detail)
                      :options (cond->
                                {:on-click
                                 (fn []
                                   (state/pub-event! [:graph/ask-for-re-index *multiple-windows?]))})}
        new-window-link (when (util/electron?)
                          {:title        (t :open-new-window)
                           :options {:on-click #(state/pub-event! [:graph/open-new-window nil])}})]
    (->>
     (concat repo-links
             [(when (seq repo-links) {:hr true})
              {:title (t :new-graph) :options {:on-click #(page-handler/ls-dir-files! shortcut/refresh!)}}
              {:title (t :all-graphs) :options {:href (rfe/href :repos)}}
              refresh-link
              reindex-link
              new-window-link])
     (remove nil?))))

(rum/defcs repos-dropdown < rum/reactive
  (rum/local false ::electron-multiple-windows?)
  [state]
  (let [multiple-windows? (::electron-multiple-windows? state)]
    (when-let [current-repo (state/sub :git/current-repo)]
      (let [repos (state/sub [:me :repos])
            repos (remove (fn [r] (= config/local-repo (:url r))) repos)
            links (repos-dropdown-links repos current-repo multiple-windows?)
            render-content (fn [{:keys [toggle-fn]}]
                             (let [repo-path (db/get-repo-name current-repo)
                                   short-repo-name (db/get-short-repo-name repo-path)]
                               [:a.item.group.flex.items-center.p-2.text-sm.font-medium.rounded-md
                                {:on-click (fn []
                                             (check-multiple-windows? state)
                                             (toggle-fn))
                                 :title repo-path} ;; show full path on hover
                                (ui/icon "database mr-2" {:style {:font-size 16} :id "database-icon"})
                                [:div.graphs
                                 [:span#repo-switch.block.pr-2.whitespace-nowrap
                                  [:span [:span#repo-name.font-medium short-repo-name]]
                                  [:span.dropdown-caret.ml-2 {:style {:border-top-color "#6b7280"}}]]]]))
            links-header (cond->
                          {:modal-class (util/hiccup->class
                                         "origin-top-right.absolute.left-0.mt-2.rounded-md.shadow-lg")}
                           (> (count repos) 1) ; show switch to if there are multiple repos
                           (assoc :links-header [:div.font-medium.text-sm.opacity-60.px-4.pt-2
                                                 "Switch to:"]))]
        (when (seq repos)
          (ui/dropdown-with-links render-content links links-header))))))
