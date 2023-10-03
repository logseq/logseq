(ns frontend.handler.reorder
  "Reorder items"
  (:require [frontend.util :as util]))

(defn reorder-items
  "Reorder items after moving 'target' to 'to'.
  Both `target` and `to` are indices."
  [items {:keys [target to]}]
  (let [items (vec items)]
    (when (and target to (not= target to))
      (let [result (->>
                    (if (< target to)
                      [(util/safe-subvec items 0 target)
                       (util/safe-subvec items (inc target) (inc to))
                       [(nth items target)]
                       (util/safe-subvec items (inc to) (count items))]
                      [(util/safe-subvec items 0 to)
                       [(nth items target)]
                       (util/safe-subvec items to target)
                       (util/safe-subvec items (inc target) (count items))])
                    (apply concat)
                    (vec))]
        (if (= (count items) (count result))
          result
          (do
            (js/console.error "Reorder failed:")
            (prn :reorder-data {:items items
                                :target target
                                :to to})
            items))))))
