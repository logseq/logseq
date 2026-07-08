(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.state]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]))

(defn- result->rows
  [result]
  (remove nil? result))

(defn- init-result
  [result view-entity]
  (let [result' (if (map? result)
                  (mapcat second result)
                  result)]
    (->> (result->rows result')
         (remove (fn [b] (contains?
                          #{(:db/id view-entity) (:logseq.property/query-id view-entity)}
                          (:db/id b))))
         (remove :logseq.property/view-for))))

(hsx/defc query-result
  [config view-entity result*]
  (let [[data set-data!] (hooks/use-state (init-result result* view-entity))
        ids (mapv :db/id data)]
    (hooks/use-effect!
     (fn []
       (set-data! (init-result result* view-entity)))
     [result*])
    [:div.query-result.w-full
     (views/view
      {:config (assoc {:custom-query? true} :sidebar? (:sidebar? config))
       :title-key :view.table/live-query-title
       :view-entity view-entity
       :view-feature-type :query-result
       :data ids
       :set-data! set-data!
       :query (:query config)
       :query-entity-ids ids})]))
