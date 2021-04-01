(ns frontend.modules.outliner.ref)

(defn- get-all-refs
  [block]
  (let [refs (if-let [refs (seq (:block/refs-with-children block))]
               refs
               (:block/refs block))]
    (distinct refs)))

(defn- wrap-refs-with-children
  ([block]
   (->> (get-all-refs block)
     (remove nil?)
     (assoc block :block/refs-with-children)))
  ([block other-children]
   (->>
     (cons block other-children)
     (mapcat get-all-refs)
     (remove nil?)
     (distinct)
     (assoc block :block/refs-with-children))))