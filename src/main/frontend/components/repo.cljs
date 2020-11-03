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
            [frontend.util :as util]
            [frontend.config :as config]
            [reitit.frontend.easy :as rfe]
            [frontend.version :as version]
            [frontend.components.commit :as commit]
            [frontend.context.i18n :as i18n]
            [clojure.string :as string]))

(rum/defc add-repo
  []
  (widgets/add-repo))

(rum/defc repos < rum/reactive
  []
  (let [{:keys [repos]} (state/sub :me)
        repos (util/distinct-by :url repos)]
    (if (seq repos)
      [:div#repos
       [:h1.title "All Repos"]

       [:div.pl-1.content
        [:div.flex.my-4 {:key "add-button"}
         (ui/button
           "Add another repo"
           :href (rfe/href :repo-add))]

        (for [{:keys [id url] :as repo} repos]
          [:div.flex.justify-between.mb-1 {:key id}
           [:a {:target "_blank"
                :href url}
            (db/get-repo-path url)]
           [:div.controls
            [:a.control {:title "Clone again and re-index the db"
                         :on-click (fn []
                                     (repo-handler/rebuild-index! repo)
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
             "Unlink"]]])]

       [:a#download-as-json.hidden]]
      (widgets/add-repo))))

(rum/defc sync-status < rum/reactive
  {:did-mount (fn [state]
                (js/setTimeout common-handler/check-changed-files-status 1000)
                state)}
  []
  (let [repo (state/get-current-repo)]
    (when-not (= repo config/local-repo)
      (let [changed-files (state/sub [:repo/changed-files repo])
            should-push? (seq changed-files)
            git-status (state/sub [:git/status repo])
            pushing? (= :pushing git-status)
            pulling? (= :pulling git-status)
            last-pulled-at (db/sub-key-value repo :git/last-pulled-at)]
        [:div.flex-row.flex.items-center
         (when pushing?
           [:span.lds-dual-ring.mt-1])
         (ui/dropdown
          (fn [{:keys [toggle-fn]}]
            [:div.cursor.w-2.h-2.sync-status.mr-2
             {:class (if (or should-push? pushing?) "bg-orange-400" "bg-green-600")
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
         (if (and should-push? (seq changed-files))
           [:div.changes
            [:ul
             (for [file changed-files]
               [:li {:key (str "sync-" file)}
                [:div.flex.flex-row.justify-between.align-items
                 [:a {:href (rfe/href :file {:path file})}
                  file]
                 [:a.ml-4.text-sm.mt-1
                  {:on-click (fn [e]
                               (export-handler/download-file! file))}
                  [:span (t :download)]]]])]]
           [:p (t :git/local-changes-synced)])]
        ;; [:a.text-sm.font-bold {:href "/diff"} "Check diff"]
        [:div.flex.flex-row.justify-between.align-items.mt-2
         (ui/button (t :git/push)
           :on-click (fn [] (state/set-modal! commit/add-commit-message)))
         (if pushing?
           [:span.lds-dual-ring.mt-1])]]
       [:hr]
       [:div
        (when-not (string/blank? last-pulled-at)
          [:p {:style {:font-size 12}} (t :git/last-pull)
           (str ": " last-pulled-at)])
        [:div.flex.flex-row.justify-between.align-items
         (ui/button (t :git/pull)
           :on-click (fn [] (repo-handler/pull-current-repo)))
         (if pulling?
           [:span.lds-dual-ring.mt-1])]
        [:p.pt-2.text-sm.opacity-50
         (t :git/version) (str " " version/version)]]])))]))))

(rum/defc repos-dropdown < rum/reactive
  [head? on-click]
  (let [current-repo (state/sub :git/current-repo)
        logged? (state/logged?)
        local-repo? (= current-repo config/local-repo)
        get-repo-name (fn [repo]
                          (if head?
                            (db/get-repo-path repo)
                            (util/take-at-most (db/get-repo-name repo) 20)))]
    (when logged?
      (if current-repo
        (let [repos (state/sub [:me :repos])]
          (if (> (count repos) 1)
            (ui/dropdown-with-links
             (fn [{:keys [toggle-fn]}]
               [:a#repo-switch {:on-click toggle-fn}
                [:span (get-repo-name current-repo)]
                [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]])
             (mapv
              (fn [{:keys [id url]}]
                {:title (get-repo-name url)
                 :options {:on-click (fn []
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
            (if local-repo?
              [:span (get-repo-name current-repo)]
              [:a
               {:href current-repo
                :target "_blank"}
               (get-repo-name current-repo)])))))))
