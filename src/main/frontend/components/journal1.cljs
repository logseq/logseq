(ns frontend.components.journal1
  (:require [frontend.modules.journal.core :as journal-core]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.handler.page :as page-handler]
            [frontend.db-mixins :as db-mixins]))

(rum/defc journal-cp < rum/reactive
  [[title format]])

(rum/defc journals <
  {:did-mount (fn [state] state)}
  [latest-journals]
  [:div#journals
   (ui/infinite-list
     (for [[journal-name format] latest-journals]
       [:div.journal-item.content {:key journal-name}
        (journal-cp [journal-name format])
        ])
     {:on-load (fn []
                 (page-handler/load-more-journals!))})])

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length 8
        latest-journals (journal-core/get-latest-journals journals-length)]
    (journals latest-journals)))