(ns frontend.components.block.selection)

(defn select-on-hover?
  [{:keys [last-client-y client-y dragging? editing-same-block? active-selection?]}]
  (and (or (not= last-client-y client-y)
           active-selection?)
       (not dragging?)
       (not editing-same-block?)))

(defn block-id-range
  [block-ids start-block-id end-block-id]
  (let [block-ids (vec block-ids)
        start-idx (.indexOf block-ids start-block-id)
        end-idx (.indexOf block-ids end-block-id)]
    (when (and (<= 0 start-idx)
               (<= 0 end-idx))
      (let [direction (if (> start-idx end-idx) :up :down)
            from-idx (min start-idx end-idx)
            to-idx (inc (max start-idx end-idx))
            ids (subvec block-ids from-idx to-idx)]
        {:direction direction
         :block-ids (if (= direction :up) (vec (reverse ids)) ids)}))))
