(ns frontend.common.schema-register
  "Set malli default registry to a mutable one,
  and use `register!` to add schemas dynamically."
  (:require [malli.core :as m]
            [malli.registry :as mr]))

(def *malli-registry (atom {}))

(defn register!
  [type schema]
  (swap! *malli-registry assoc type schema))

(defn not-register-yet?
  [type]
  (boolean (nil? (@*malli-registry type))))

(defn init
  []
  (reset! *malli-registry {})
  (mr/set-default-registry!
   (mr/composite-registry
    (m/default-schemas)
    (mr/mutable-registry *malli-registry))))
