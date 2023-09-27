(ns frontend.handler.reorder
  "Reorder items")

(defn- split-col-by-element
  [col element]
  (let [col (vec col)
        idx (.indexOf col element)]
    [(subvec col 0 (inc idx))
     (subvec col (inc idx))]))

(defn reorder-items
  [items {:keys [target to up?]}]
  (when (and target to (not= target to))
    (let [[prev next] (split-col-by-element items to)
          [prev next] (mapv #(remove (fn [e] (= target e)) %) [prev next])]
      (->>
       (if up?
         (concat (drop-last prev) [target (last prev)] next)
         (concat prev [target] next))
       (remove nil?)
       distinct
       vec))))
