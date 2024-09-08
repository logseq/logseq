(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [rum.core :as rum]
            [frontend.util :as util]))

(defn- columns
  [config result]
  (->> (mapcat (comp keys :block/properties) result)
       distinct
       (map db/entity)
       (ldb/sort-by-order)
       (views/build-columns config)))

(defn- result->entities
  [result]
  (map (fn [b]
         (assoc (db/entity (:db/id b)) :id (:db/id b))) result))

(rum/defc query-result < rum/static
  [config current-block result]
  (let [result' (result->entities result)
        [data set-data!] (rum/use-state result')
        columns' (columns config result')
        view-entity current-block]
    (rum/use-effect!
     (fn []
       (set-data! (result->entities result)))
     [result])
    [:div.query-result.w-full.mt-2
     {:on-pointer-down (fn [e]
                         (util/stop e))}
     (views/view view-entity
                 {:data data
                  :set-data! set-data!
                  :render-empty-title? true
                  :columns columns'})]))
