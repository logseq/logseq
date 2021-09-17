(ns frontend.components.journal
  (:require [clojure.string :as string]
            [frontend.components.onboarding :as onboarding]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc blocks-cp < rum/reactive db-mixins/query
  {}
  [repo page format]
  (when-let [page-e (db/pull [:block/name (string/lower-case page)])]
    (page/page-blocks-cp repo page-e {})))

(rum/defc journal-cp < rum/reactive
  [[title format]]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        repo (state/sub :git/current-repo)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))
        intro? (and (not (state/logged?))
                    (not (config/local-db? repo))
                    (not config/publishing?)
                    today?)
        page-entity (db/pull [:block/name (string/lower-case title)])
        data-page-tags (when (seq (:block/tags page-entity))
                         (let [page-names (model/get-page-names-by-ids (map :db/id (:block/tags page)))]
                           (text/build-data-value page-names)))]
    [:div.flex-1.journal.page (cond->
                               {:class (if intro? "logseq-intro" "")}
                                data-page-tags
                                (assoc :data-page-tags data-page-tags))

     (when intro?
       (ui/admonition
        :warning
        [:p (util/format
             "Feel free to edit anything, no change will be saved at this moment. If you do want to persist your work, click the \"Open\" button to open a local directory%s."
             (if (util/electron?) "" " or connect Logseq to GitHub"))]))

     (ui/foldable
      [:a.initial-color.title.journal-title
       {:href     (rfe/href :page {:name page})
        :on-click (fn [e]
                    (when (gobj/get e "shiftKey")
                      (when-let [page page-entity]
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page)
                         :page
                         {:page     page
                          :journal? true}))
                      (.preventDefault e)))}
       [:h1.title
        (util/capitalize-all title)]]

      (blocks-cp repo page format)

      {})

     (when intro? (widgets/add-graph))

     (page/today-queries repo today? false)

     (rum/with-key
       (reference/references title false)
       (str title "-refs"))

     (when intro? (onboarding/intro))]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list "main-container"
                     (for [[journal-name format] latest-journals]
                       [:div.journal-item.content {:key journal-name}
                        (journal-cp [journal-name format])])
                     {:has-more (page-handler/has-more-journals?)
                      :on-load (fn []
                                 (page-handler/load-more-journals!))})])

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    (journals latest-journals)))
