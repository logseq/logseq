(ns frontend.mobile.haptics
  (:require
   ["@capacitor/haptics" :refer [Haptics ImpactStyle]]
   [promesa.core :as p]))

(defn with-haptics-impact
  [fn impact-style]
  (let [style (cond
                (= impact-style :light)
                {:style (.-Light ImpactStyle)}

                (= impact-style :medium)
                {:style (.-Medium ImpactStyle)})]
    (p/do! (.impact Haptics (clj->js style))
           fn)))
