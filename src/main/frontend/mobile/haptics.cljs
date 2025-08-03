(ns frontend.mobile.haptics
  (:require
   ["@capacitor/haptics" :refer [Haptics ImpactStyle]]
   [frontend.util :as util]))

(defn haptics
  ([]
   (haptics :light))
  ([impact-style]
   (when (util/capacitor-new?)
     (let [style (cond
                   (= impact-style :light)
                   {:style (.-Light ImpactStyle)}

                   (= impact-style :medium)
                   {:style (.-Medium ImpactStyle)})]
       (.impact Haptics (clj->js style))))))
