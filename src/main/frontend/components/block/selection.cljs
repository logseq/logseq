(ns frontend.components.block.selection)

(defonce *pointer-is-down? (atom false))

(defn set-pointer-down!
  []
  (reset! *pointer-is-down? true))

(defn clear-pointer-down!
  ([]
   (reset! *pointer-is-down? false))
  ([_]
   (clear-pointer-down!)))

(defn pointer-down?
  []
  (true? @*pointer-is-down?))

(defn select-on-hover?
  [{:keys [last-client-y client-y dragging? editing-same-block? active-selection?
           virtualized? pointer-moved?]}]
  (boolean
   (and (or (not virtualized?) pointer-moved?)
        (or (not= last-client-y client-y)
            (and active-selection? (not virtualized?)))
        (not dragging?)
        (not editing-same-block?))))

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

(defn virtual-range-boundary-id
  [block-ids direction start-index end-index]
  (case direction
    :down (nth block-ids end-index)
    :up (nth block-ids start-index)
    nil))

(defn unselected-block-ids
  [selected-block-ids block-ids]
  (->> block-ids
       (remove (set selected-block-ids))
       distinct
       vec))
