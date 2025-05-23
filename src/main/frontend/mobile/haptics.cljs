(ns frontend.mobile.haptics
  (:require
   ["@capacitor/haptics" :refer [Haptics ImpactStyle]]
   [promesa.core :as p]))

(defn haptics
  [impact-style]
  (let [style (cond
                (= impact-style :light)
                {:style (.-Light ImpactStyle)}

                (= impact-style :medium)
                {:style (.-Medium ImpactStyle)})]
    (.impact Haptics (clj->js style))))

(defn with-haptics-impact
  [result impact-style]
  (p/do!
   (haptics impact-style)
   result))
