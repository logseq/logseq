(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc query-result
  [config view-entity result*]
  [:div.query-result.w-full
   (views/view
    {:config {:custom-query? true
              :sidebar? (:sidebar? config)}
     :title-key :view.table/live-query-title
     :view-uuid (:block/uuid view-entity)
     :view-feature-type :query-result
     :query-row-uuids result*})])
