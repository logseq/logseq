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

(defn mounted-nodes?
  [start-node end-node]
  (boolean (and (some-> start-node .-isConnected)
                (some-> end-node .-isConnected))))

(defn mounted-node-range
  [nodes start-node end-node]
  (let [nodes (vec nodes)
        start-idx (.indexOf nodes start-node)
        end-idx (.indexOf nodes end-node)]
    (when (and (<= 0 start-idx)
               (<= 0 end-idx))
      (let [direction (if (> start-idx end-idx) :up :down)
            from-idx (min start-idx end-idx)
            to-idx (inc (max start-idx end-idx))
            nodes (subvec nodes from-idx to-idx)]
        {:direction direction
         :nodes (if (= direction :up) (vec (reverse nodes)) nodes)}))))
