(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [frontend.state]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [rum.core :as rum]))

(defn- columns
  [config result]
  (->> (mapcat :block.temp/property-keys result)
       distinct
       (map db/entity)
       (ldb/sort-by-order)
       ((fn [cs] (views/build-columns config cs {:add-tags-column? false})))))

(defn- result->entities
  [result]
  (map (fn [b] (or (db/entity (:db/id b)) b)) result))

(defn- init-result
  [result view-entity]
  (let [result' (if (map? result)
                  (mapcat second result)
                  result)]
    (->> (result->entities result')
         (remove (fn [b] (contains?
                          #{(:db/id view-entity) (:db/id (:logseq.property/query view-entity))}
                          (:db/id b))))
         (remove :logseq.property/view-for))))

(rum/defc query-result
  [config view-entity result*]
  (let [[data set-data!] (rum/use-state (init-result result* view-entity))
        ids (mapv :db/id data)
        columns' (columns config data)]
    (hooks/use-effect!
     (fn []
       (set-data! (init-result result* view-entity)))
     [result*])
    [:div.query-result.w-full
     (views/view
      {:config {:custom-query? true}
       :title-key :views.table/live-query-title
       :view-entity view-entity
       :view-feature-type :query-result
       :data ids
       :set-data! set-data!
       :query-entity-ids ids
       :columns columns'})]))
