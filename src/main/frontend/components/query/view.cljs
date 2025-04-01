(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [frontend.mixins :as mixins]
            [frontend.state]
            [logseq.db :as ldb]
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
  {:will-remount (fn [old-state new-state]
                   (let [*result (::result new-state)
                         [_config view-entity old-result] (:rum/args old-state)
                         [_config _view-entity new-result] (:rum/args old-state)]
                     (when-not (= old-result new-result)
                       (reset! *result (init-result new-result view-entity))))
                   new-state)}
  [state config view-entity result]
  (let [*result (::result state)
        result' (->> (or @*result (init-result result view-entity))
                     (remove :logseq.property/view-for))
        columns' (columns (assoc config :container-id (::container-id state)) result')
        set-data! (fn [data] (reset! *result data))]
    (prn :debug :view-result result')
    [:div.query-result.w-full
     (views/view
      {:config {:custom-query? true}
       :title-key :views.table/live-query-title
       :view-entity view-entity
       :view-feature-type :query-result
       :data (mapv :db/id result')
       :query-entity-ids (mapv :db/id result')
       :set-data! set-data!
       :columns columns'})]))
