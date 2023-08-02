(ns frontend.components.journal
  (:require [clojure.string :as string]
            [frontend.components.page :as page]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc blocks-cp < rum/reactive db-mixins/query
  {}
  [repo page]
  (when-let [page-e (db/pull [:block/name (util/page-name-sanity-lc page)])]
    (page/page-blocks-cp repo page-e {})))

(rum/defc journal-cp < rum/reactive
  [title]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        repo (state/sub :git/current-repo)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))
        page-entity (db/pull [:block/name (util/page-name-sanity-lc title)])
        data-page-tags (when (seq (:block/tags page-entity))
                         (let [page-names (model/get-page-names-by-ids (map :db/id (:block/tags page)))]
                           (text-util/build-data-value page-names)))]
    [:div.flex.flex-col.journal.page (cond-> {}
                                data-page-tags
                                (assoc :data-page-tags data-page-tags))

     [:.flex-1
      (ui/foldable
       [:div.ls-page-title.flex-1.flex.items-center
        [:a.flex-1
         {:href (rfe/href :page {:name page})}
         (page/page-title (:block/name page-entity) "" title (db/get-page-format page-entity) true)]
        (page-menu/page-actions-dropdown page)]


       [:.sm:mt-8.mt-8
        (if today?
          (blocks-cp repo page)
          (ui/lazy-visible
           (fn [] (blocks-cp repo page))
           {:debug-id (str "journal-blocks " page)}))]

       {})]

     (page/today-queries repo today? false)

     (when today?
       (scheduled/scheduled-and-deadlines page))

     (rum/with-key
       (reference/references title)
       (str title "-refs"))]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    "main-content-container"
    (for [{:block/keys [name]} latest-journals]
      [:div.content.color-level.rounded-xl.p-6.sm:p-12.mb-4.journal-item {:key name}
       (journal-cp name)])
    {:has-more (page-handler/has-more-journals?)
     :more-class "text-4xl"
     :on-top-reached page-handler/create-today-journal!
     :on-load (fn []
                (page-handler/load-more-journals!))})])

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    (journals latest-journals)))
