(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.date :as date]
            [frontend.handler :as handler]
            [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.utf8 :as utf8]
            [goog.object :as gobj]
            [clojure.string :as string]))

(rum/defc journal-cp < rum/reactive
  [[title format]]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        raw-headings (db/get-page-headings page)
        raw-headings (when (seq raw-headings)
                       (update (vec raw-headings) 0 assoc :heading/lock? true))
        headings (db/with-dummy-heading raw-headings format nil true)
        encoded-page-name (util/url-encode page)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))]
    ;; no contents yet
    (when (and today? (= 1 (count raw-headings)))
      (when-let [template (state/get-journal-template)]
        (handler/insert-new-heading!
         (first headings)
         (str (:heading/content (first headings)) "\n" template)
         false)))
    [:div.flex-1
     [:a.initial-color {:href (str "/page/" encoded-page-name)
                        :on-click (fn [e]
                                    (util/stop e)
                                    (when (gobj/get e "shiftKey")
                                      (when-let [page (db/pull [:page/name title])]
                                        (state/sidebar-add-block!
                                         (:db/id page)
                                         :page
                                         {:page page
                                          :journal? true}))
                                      (handler/show-right-sidebar)))}
      [:h1.title
       (util/capitalize-all title)]]
     (content/content encoded-page-name
                      {:hiccup (hiccup/->hiccup headings
                                                {:id encoded-page-name
                                                 :start-level 2})})

     (when today?
       (when-let [repo (state/get-current-repo)]
         (let [queries (state/sub [:config repo :default-queries :journals])]
           (when (seq queries)
             [:div#today-queries
              (for [{:keys [title query]} queries]
                [:div {:key (str "query-" title)}
                 (hiccup/custom-query {:start-level 2} {:query-title title}
                                      query)])]))))

     (reference/references title)]))

(rum/defc journals <
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name format] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name format])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
