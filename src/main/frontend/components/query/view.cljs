(ns frontend.components.query.view
  "DB query result view"
  (:require [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.ui :as ui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc query-result
  [config view-entity result*]
  [:div.query-result.w-full
   (ui/catch-error
    (ui/block-error (t :query/error) {:content (pr-str (:query config))})
    (views/view
     {:config {:custom-query? true
               :sidebar? (:sidebar? config)}
      :title-key :view.table/live-query-title
      :view-uuid (:block/uuid view-entity)
      :view-feature-type :query-result
      :query-row-uuids result*}))])
