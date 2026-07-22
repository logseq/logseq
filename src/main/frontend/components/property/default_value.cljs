(ns frontend.components.property.default-value
  (:require [io.factorhouse.hsx.core :as hsx]
            [frontend.components.property.value :as pv]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(hsx/defc default-value-config
  [property*]
  (let [property (db-hooks/use-block (:block/uuid property*))
        [default-value-property set-default-value-property!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [property (state/<invoke-db-worker :thread-api/pull
                                                 (state/get-current-repo)
                                                 '[* {:property/closed-values [*]}]
                                                 :logseq.property/default-value)]
         (set-default-value-property! property))
       nil)
     [])
    (when (and property default-value-property)
      (pv/property-value property
                         default-value-property
                         {}))))
