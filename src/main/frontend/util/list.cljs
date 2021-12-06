(ns frontend.util.list
  (:require [frontend.util.thingatpt :as thingatpt]
            [frontend.util.cursor :as cursor]))

(defn- get-prev-item [& [input]]
  (when-let [item (thingatpt/list-item-at-point input)]
    (let [{:keys [bullet ordered]} item]
      (when-not (or (cursor/textarea-cursor-first-row? input)
                    (and ordered
                         (= bullet "1")))
        (cursor/move-cursor-up input)
        (thingatpt/list-item-at-point input)))))

(defn- get-next-item [& [input]]
  (when-let [item (thingatpt/list-item-at-point input)]
    (let [{:keys [_bullet _ordered]} item]
      (when-not (cursor/textarea-cursor-last-row? input)
        (cursor/move-cursor-down input)
        (thingatpt/list-item-at-point input)))))

