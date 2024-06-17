(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]
            [goog.dom :as gdom]
            [frontend.util :as util]))

(rum/defc journal-cp < rum/reactive
  [page]
  [:div.journal-item.content {:key (:db/id page)}
   (let [repo (state/sub :git/current-repo)]
     (page/page {:repo repo
                 :page-name (str (:block/uuid page))}))])

(rum/defc journals < rum/reactive
  {:will-unmount (fn [state]
                   (state/set-journals-length! 3)
                   state)}
  [latest-journals]
  (when (seq latest-journals)
    [:div#journals
     (ui/virtuoso
      {:use-window-scroll true
       :custom-scroll-parent (gdom/getElement "main-content-container")
       :initial-item-count 1
       :total-count (count latest-journals)
       :item-content (fn [idx]
                       (when-let [page (util/nth-safe latest-journals idx)]
                         (journal-cp page)))
       :start-reached (fn [_idx]
                        (page-handler/create-today-journal!))
       :end-reached (fn [idx]
                      (when (= (dec (count latest-journals)) idx)
                        (page-handler/load-more-journals!)))})]))

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    (journals latest-journals)))
