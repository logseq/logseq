(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.components.views :as views]
            [frontend.hooks :as hooks]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc journal-cp < rum/static
  [id]
  [:div.journal-item.content
   (page/page-cp {:db/id id})])

(rum/defc all-journals
  []
  (let [[data set-data!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [{:keys [data]} (views/<load-view-data nil {:journals? true})]
         (set-data! (remove nil? data))))
     [])
    [:div#journals
     (ui/virtualized-list
      {:custom-scroll-parent (gdom/getElement "main-content-container")
       :increase-viewport-by {:top 300 :bottom 300}
       :compute-item-key (fn [idx]
                           (let [id (util/nth-safe data idx)]
                             (str "journal-" id)))
       :total-count (count data)
       :item-content (fn [idx]
                       (let [id (util/nth-safe data idx)]
                         (journal-cp id)))})]))
