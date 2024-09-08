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

(defn- init-result
  [result]
  (let [result' (if (map? result)
                  (mapcat second result)
                  result)]
    (result->entities result')))

(rum/defc query-result < rum/static
  [config view-entity result]
  (let [result' (init-result result)
        [data set-data!] (rum/use-state result')
        columns' (columns config result')]
    (rum/use-effect!
     (fn []
       (set-data! (init-result result)))
     [result])
    [:div.query-result.w-full.mt-1
     {:on-pointer-down util/stop-propagation}
     (views/view view-entity
                 {:title-key :views.table/live-query-title
                  :data data
                  :set-data! set-data!
                  :columns columns'})]))
