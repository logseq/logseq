(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [rum.core :as rum]
            [frontend.mixins :as mixins]
            [promesa.core :as p]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state]))

(defn- columns
  [config result]
  (->> (mapcat (comp keys :block/properties) result)
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
        result' (or @*result (init-result result view-entity))
        columns' (columns (assoc config :container-id (::container-id state)) result')
        set-data! (fn [data] (reset! *result data))]
    [:div.query-result.w-full
     (views/view view-entity
                 {:title-key :views.table/live-query-title
                  :data result'
                  :set-data! set-data!
                  :columns columns'
                  :on-delete-rows (fn [table selected-rows]
                                    (let [pages (filter ldb/page? selected-rows)
                                          blocks (remove ldb/page? selected-rows)
                                          selected (set (map :id selected-rows))
                                          data' (remove (fn [row] (contains? selected (:id row))) (:data table))]
                                      (p/do!
                                       (set-data! data')
                                       (ui-outliner-tx/transact!
                                        {:outliner-op :delete-blocks}
                                        (when (seq blocks)
                                          (outliner-op/delete-blocks! blocks nil))
                                        (doseq [page pages]
                                          (when-let [id (:block/uuid page)]
                                            (outliner-op/delete-page! id)))))))})]))
