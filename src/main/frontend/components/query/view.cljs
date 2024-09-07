(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.db :as db]))

(defn- columns
  [config result]
  (->> (mapcat (comp keys :block/properties) result)
       distinct
       (map db/entity)
       (ldb/sort-by-order)
       (views/build-columns config)))

(rum/defc query-result < rum/static
  [config current-block result]
  (let [result' (map (fn [b]
                       (assoc (db/entity (:db/id b)) :id (:db/id b))) result)
        [data set-data!] (rum/use-state result')
        columns' (columns config result')
        _ (prn :debug :columns columns')
        view-entity current-block]
    (rum/use-effect!
     (fn []
       (when-let [^js worker @state/*db-worker]
         (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                 result (ldb/read-transit-str result-str)
                 data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
           (set-data! data))))
     [])
    [:div.query-result.w-full.mt-2
     (views/view view-entity
                 {:data data
                  :set-data! set-data!
                  :render-empty-title? true
                  :columns columns'})]))
