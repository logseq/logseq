(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.mixins :as mixins]))

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
  [result view-entity]
  (let [result' (if (map? result)
                  (mapcat second result)
                  result)]
    (->> (result->entities result')
         (remove (fn [b] (contains?
                          #{(:db/id view-entity) (:db/id (:logseq.property/query view-entity))}
                          (:db/id b)))))))

(rum/defcs query-result < rum/static mixins/container-id
  (rum/local nil ::result)
  [state config view-entity result]
  (let [*result (::result state)
        result' (or @*result (init-result result view-entity))
        columns' (columns (assoc config :container-id (::container-id state)) result')]
    [:div.query-result.w-full.mt-1
     {:on-pointer-down util/stop-propagation}
     (views/view view-entity
                 {:title-key :views.table/live-query-title
                  :data result'
                  :set-data! #(reset! *result %)
                  :columns columns'})]))
