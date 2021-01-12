(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.components.widgets :as widgets]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.util :as util]
            [frontend.config :as config]
            [reitit.frontend.easy :as rfe]
            [frontend.version :as version]
            [frontend.components.commit :as commit]
            [frontend.components.svg :as svg]
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

         [:div.pl-1.content
          [:div.flex.flex-row.my-4
           (when (nfs-handler/supported?)
             [:div.mr-8
              (ui/button
               (t :open-a-directory)
               :on-click nfs-handler/ls-dir-files)])
           (when (state/logged?)
             (ui/button
              "Add another git repo"
              :href (rfe/href :repo-add nil {:graph-types "github"})))]
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
                [:a.control {:title (if local?
                                      "Sync with the local directory"
                                      "Clone again and re-index the db")
                             :on-click (fn []
                                         (if local?
                                           (nfs-handler/rebuild-index! url
                                                                 repo-handler/create-today-journal!)
                                           (repo-handler/rebuild-index! url))
                                         (js/setTimeout
                                          (fn []
                                            (route-handler/redirect! {:to :home}))
                                          500))}
                 "Re-index"]
                [:a.control.ml-4 {:title "Clone again and re-index the db"
                                  :on-click (fn []
                                              (export-handler/export-repo-as-json! (:url repo)))}
                 "Export as JSON"]
                [:a.text-gray-400.ml-4 {:on-click (fn []
                                                    (repo-handler/remove-repo! repo))}
                 "Unlink"]]]))]

         [:a#download-as-json.hidden]]
        (widgets/add-graph)))))

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
            [:div.ml-2.mr-1.opacity-70.hover:opacity-100 {:class (if syncing? "loader" "initial")}
             [:a
              {:on-click #(nfs-handler/refresh! repo
                                                repo-handler/create-today-journal!)
               :title (str "Sync files with the local directory: " (config/get-local-dir repo) ".\nVersion: "
                           version/version)}
              svg/refresh]])
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
  [head? on-click]
  (when-let [current-repo (state/sub :git/current-repo)]
    (let [logged? (state/logged?)
          local-repo? (= current-repo config/local-repo)
          get-repo-name (fn [repo]
                          (if (config/local-db? repo)
                            (config/get-local-dir repo)
                            (if head?
                              (db/get-repo-path repo)
                              (util/take-at-most (repo-handler/get-repo-name repo) 20))))]
      (let [repos (->> (state/sub [:me :repos])
                       (remove (fn [r] (= config/local-repo (:url r)))))]
        (cond
          (> (count repos) 1)
          (ui/dropdown-with-links
           (fn [{:keys [toggle-fn]}]
             [:a#repo-switch {:on-click toggle-fn}
              [:span (get-repo-name current-repo)]
              [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]])
           (mapv
            (fn [{:keys [id url]}]
              {:title (get-repo-name url)
               :options {:on-click (fn []
                                     (repo-handler/push-if-auto-enabled! (state/get-current-repo))

                                     (state/set-current-repo! url)
                                     (when-not (= :draw (state/get-current-route))
                                       (route-handler/redirect-to-home!))
                                     (when on-click
                                       (on-click url)))}})
            (remove (fn [repo]
                      (= current-repo (:url repo)))
                    repos))
           {:modal-class (util/hiccup->class
                          "origin-top-right.absolute.left-0.mt-2.w-48.rounded-md.shadow-lg ")})

          (and current-repo (not local-repo?))
          (let [repo-name (get-repo-name current-repo)]
            (if (config/local-db? current-repo)
              repo-name
              [:a
               {:href current-repo
                :target "_blank"}
               repo-name]))

          :else
          nil)))))
