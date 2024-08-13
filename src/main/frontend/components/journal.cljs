(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [rum.core :as rum]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [frontend.mixins :as mixins]))

(rum/defc journal-cp < rum/reactive
  [page]
  [:div.journal-item.content {:key (:db/id page)}
   (let [repo (state/sub :git/current-repo)]
     (page/page {:repo repo
                 :page-name (str (:block/uuid page))}))])

(defn on-scroll
  [node {:keys [threshold on-load]
         :or {threshold 500}}]
  (when (util/bottom-reached? node threshold)
    (on-load)))

(defn attach-listeners
  "Attach scroll and resize listeners."
  [state]
  (let [node (js/document.getElementById "main-content-container")
        opts {:on-load page-handler/load-more-journals!}
        debounced-on-scroll (debounce #(on-scroll node opts) 100)]
    (mixins/listen state node :scroll debounced-on-scroll)))

(rum/defc journals < rum/reactive
  (mixins/event-mixin attach-listeners)
  {:will-unmount (fn [state]
                   (state/set-journals-length! 3)
                   state)}
  [latest-journals]
  (when (seq latest-journals)
    [:div#journals
     (for [journal latest-journals]
       (journal-cp journal))]))

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    (journals latest-journals)))
