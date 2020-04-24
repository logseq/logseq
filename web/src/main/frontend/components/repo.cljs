(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.components.widgets :as widgets]
            [frontend.components.sidebar :as sidebar]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler :as handler]))

(rum/defc add-repo
  []
  (sidebar/sidebar
   (widgets/add-repo)))

(rum/defc repos < rum/reactive
  []
  (sidebar/sidebar
   (let [{:keys [repos]} (state/sub :me)]
     (if (seq repos)
       [:div#repos
        [:h1.title "Your Repos: "]
        (for [{:keys [id url] :as repo} repos]
          [:div.flex.justify-between.mb-1 {:key id}
           [:a {:target "_blank"
                :href url}
            (db/get-repo-path url)]
           [:div.controls
            [:a.control {:on-click (fn []
                                     (handler/rebuild-index! repo))}
             "Rebuild index"]
            [:a.text-gray-400.ml-4 {:on-click (fn []
                                                (handler/remove-repo! repo))}
             "Remove"]]])]
       (widgets/add-repo)))))
