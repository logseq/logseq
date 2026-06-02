(ns frontend.components.property.default-value
  (:require [io.factorhouse.hsx.core :as hsx]
            [frontend.components.property.value :as pv]
            [frontend.db :as db]))

(hsx/defc default-value-config
  [property]
  (pv/property-value property
                     (db/entity :logseq.property/default-value)
                     {}))
