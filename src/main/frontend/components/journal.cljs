(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

(rum/defc journal-cp < rum/reactive
  [page]
  (let [repo (state/sub :git/current-repo)]
    (page/page {:repo repo
                :page-name (str (:block/uuid page))})))

(rum/defc journals < rum/reactive
  {:will-unmount (fn [state]
                   (state/set-journals-length! 1)
                   state)}
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    "main-content-container"
    (for [{:block/keys [name] :as page} latest-journals]
      [:div.journal-item.content {:key name}
       (journal-cp page)])
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
