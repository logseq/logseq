(ns frontend.components.journal
  (:require [clojure.string :as string]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
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
        repo (state/sub :git/current-repo)]
    (page/page {:repo repo
                :page-name page})))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    "main-content-container"
    (for [{:block/keys [name]} latest-journals]
      [:div.journal-item.content {:key name}
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
