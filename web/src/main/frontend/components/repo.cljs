(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.components.widgets :as widgets]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler :as handler]
            [frontend.util :as util]))

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
           :href "/repo/add")]

        (for [{:keys [id url] :as repo} repos]
          [:div.flex.justify-between.mb-1 {:key id}
           [:a {:target "_blank"
                :href url}
            (db/get-repo-path url)]
           [:div.controls
            [:a.control {:title "Clone again and re-index the db"
                         :on-click (fn []
                                     (handler/rebuild-index! repo)
                                     (js/setTimeout
                                      (fn []
                                        (handler/redirect! {:to :home}))
                                      500))}
             "Re-index"]
            [:a.control.ml-4 {:title "Clone again and re-index the db"
                         :on-click (fn []
                                     (handler/export-repo-as-json! (:url repo)))}
             "Export as JSON"]
            [:a.text-gray-400.ml-4 {:on-click (fn []
                                                (handler/remove-repo! repo))}
             "Unlink"]]])]

       [:a#download-as-json.hidden]]
      (widgets/add-repo))))
