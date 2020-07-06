(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
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

(defn- journal-include-template!
  [state]
  (let [[[title format]] (:rum/args state)
        page (string/lower-case title)
        today? (= page (string/lower-case (date/journal-name)))
        repo (state/get-current-repo)]
    ;; no contents yet
    (when today?
      (let [raw-headings (db/get-page-headings repo page)
            headings (db/with-dummy-heading raw-headings format nil true)]
        (prn {:today? today?
              :raw-headings (count raw-headings)
              :template (state/get-journal-template)})
        (when (= 1 (count raw-headings))
          (when-let [template (state/get-journal-template)]
            (handler/insert-new-heading!
             (first headings)
             template
             false
             nil))))))
  state)

(rum/defc journal-cp < rum/reactive
  {:init journal-include-template!
   :did-update journal-include-template!}
  [[title format]]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        repo (state/get-current-repo)
        raw-headings (db/get-page-headings repo page)
        headings (db/with-dummy-heading raw-headings format nil true)
        encoded-page-name (util/encode-str page)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))]
    [:div.flex-1
     [:a.initial-color {:href (str "/page/" encoded-page-name)
                        :on-click (fn [e]
                                    (util/stop e)
                                    (when (gobj/get e "shiftKey")
                                      (when-let [page (db/pull [:page/name title])]
                                        (state/sidebar-add-block!
                                         (state/get-current-repo)
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
                                                 :start-level 2}
                                                {})})

     (when today?
       (when-let [repo (state/get-current-repo)]
         (let [queries (state/sub [:config repo :default-queries :journals])]
           (when (seq queries)
             [:div#today-queries
              (for [{:keys [title query]} queries]
                [:div {:key (str "query-" title)}
                 (hiccup/custom-query {:start-level 2} {:query-title title}
                                      query)])]))))

     (reference/references title false)]))

(rum/defc journals <
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name format] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name format])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
