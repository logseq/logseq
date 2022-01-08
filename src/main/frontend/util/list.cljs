(ns frontend.util.list
  (:require [frontend.util.thingatpt :as thingatpt]
            [frontend.util.cursor :as cursor]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.db :as db]))

(defn get-prev-item [& [input]]
  (when-not (cursor/textarea-cursor-first-row? input)
    (if-let [item (thingatpt/list-item-at-point input)]
      (let [{:keys [bullet ordered]} item]
        (when-not (and ordered (= bullet "1"))
          (cursor/move-cursor-up input)))
      (cursor/move-cursor-up input))
    (thingatpt/list-item-at-point input)))

(defn get-next-item [& [input]]
  (when-let [item (thingatpt/list-item-at-point input)]
    (let [{:keys [_bullet _ordered]} item]
      (when-not (cursor/textarea-cursor-last-row? input)
        (cursor/move-cursor-down input)
        (thingatpt/list-item-at-point input)))))

(defn list-beginning-pos [& [input]]
  (when-let [item (thingatpt/list-item-at-point input)]
    (let [current-pos (cursor/pos input)
          item-start (:start item)
          beginning-pos (atom item-start)]
      (while (when-let [prev-item (get-prev-item input)]
               (reset! beginning-pos (:start prev-item))))
      (cursor/move-cursor-to input current-pos)
      @beginning-pos)))

(defn list-end-pos [& [input]]
  (when-let [item (thingatpt/list-item-at-point input)]
    (let [current-pos (cursor/pos input)
          item-end (:end item)
          end-pos (atom item-end)]
      (while (when-let [next-item (get-next-item input)]
               (reset! end-pos (:end next-item))))
      (cursor/move-cursor-to input current-pos)
      @end-pos)))
