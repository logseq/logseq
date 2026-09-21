(ns frontend.components.property.default-value
  (:require [io.factorhouse.hsx.core :as hsx]
            [frontend.components.property.value :as pv]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(def default-value-property-pull-pattern
  "Pull pattern for the built-in :logseq.property/default-value entity.

  :property/closed-values is a virtual entity-plus attribute, not a datascript
  ref. Including it in a pull map spec throws and leaves the default-value
  submenu empty."
  '[*])

(hsx/defc default-value-config
  [property*]
  (let [property (or (db-hooks/use-block (:block/uuid property*)) property*)
        [default-value-property set-default-value-property!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [loaded (state/<invoke-db-worker :thread-api/pull
                                               (state/get-current-repo)
                                               default-value-property-pull-pattern
                                               :logseq.property/default-value)]
         (set-default-value-property! loaded))
       nil)
     [])
    [:div.ls-property-default-value-pane
     (when (and property default-value-property)
       (pv/property-value property
                          default-value-property
                          {}))]))
