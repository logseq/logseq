(ns frontend.util.list
  "High level list operations for use in editor"
  (:require [frontend.util.thingatpt :as thingatpt]
            [frontend.util.cursor :as cursor]
            [clojure.string :as string]))

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

(defn- newline?
  [line]
  (or (= line "\n") (= line "\r\n")))

(defn re-order-items
  [lines start-idx]
  (loop [lines lines
         idx start-idx
         result []
         double-newlines? false]
    (let [[line & others] lines]
      (if (empty? lines)
        (->> result
             (map (fn [line] (if (newline? line) "" line)))
             (string/join "\n"))
        (let [[_ num-str] (re-find #"^(\d+){1}\." line)
              num (if num-str (parse-long num-str) nil)
              double-newlines?' (or double-newlines?
                                     (and (newline? line) (seq others) (newline? (first others))))
              [idx' result'] (if (and (not double-newlines?') num)
                               (let [idx' (inc idx)
                                     line' (string/replace-first line (str num ".") (str idx' "."))]
                                 [idx' (conj result line')])
                               [idx (conj result line)])]
          (recur others idx' result' double-newlines?'))))))
