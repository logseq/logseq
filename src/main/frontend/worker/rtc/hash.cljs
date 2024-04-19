(ns frontend.worker.rtc.hash
  "Calculate the hash of the blocks to compare whether
  these blocks are consistent with the remote.")

(defn- block-entity->str
  "Convert block-entity to a string(concat by values selected by :selected-keys).
  'selected-keys':  it's a ordered coll"
  [selected-keys block-entity]
  (->> selected-keys
       (reduce
        (fn [r k-or-ks]
          (let [v (if (sequential? k-or-ks)
                    (get-in block-entity k-or-ks)
                    (get block-entity k-or-ks))]
            (if (nil? v)
              (reduced nil)
              (conj r v))))
        [])
       (apply str)))


(defn hash-blocks
  [block-entities & {:keys [selected-keys]
                     :or {selected-keys [:block/uuid
                                         [:block/left :block/uuid]
                                         [:block/parent :block/uuid]]}}]
  (let [str-set (set (keep (partial block-entity->str selected-keys) block-entities))]
    {:hash (hash str-set)
     :count (count str-set)}))
