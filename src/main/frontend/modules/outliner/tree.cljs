(ns frontend.modules.outliner.tree
  (:require [frontend.modules.outliner.ref :as outliner-ref]
            [clojure.set :as set]
            [frontend.modules.outliner.utils :as outliner-u]))

(defprotocol INode
  (-get-id [this])
  (-get-parent-id [this])
  (-set-parent-id [this parent-id])
  (-get-left-id [this])
  (-set-left-id [this left-id])

  (-get-parent [this])
  (-get-left [this])
  (-get-right [this])
  (-get-down [this])

  (-save [this])
  (-del [this])
  (-get-children [this]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

(defn- prepare-blocks
  "Preparing blocks: index blocks,filter ids,and update some keys."
  [blocks]
  (loop [[f & r] blocks
         ids #{}
         parents #{}
         ;; {[parent left] db-id}
         indexed-by-position {}]
    (if (nil? f)
      {:ids ids :parents parents :indexed-by-position indexed-by-position}
      (let [f (cond-> f
                (not (:block/dummy? f))
                (dissoc f :block/meta))
            {:block/keys [parent left] db-id :db/id} f
            new-ids (conj ids db-id)
            new-parents (conj parents (outliner-u/->db-id parent))
            new-indexed-by-position
            (let [position (mapv outliner-u/->db-id [parent left])]
              (when (get indexed-by-position position)
                (throw (js/Error. "Two block occupy the same position")))
              (assoc indexed-by-position position f))]
        (recur r new-ids new-parents new-indexed-by-position)))))

(defn get-children-from-memory
  [parent-id indexed-by-position]
  (loop [left parent-id
         children []]
    (if-let [{db-id :db/id :as child} (get indexed-by-position [parent-id left])]
      (recur db-id (conj children child))
      children)))

(comment
  (defn- clip-block
    "For debug. It's should be removed."
    [x]
    (let [ks [:block/parent :block/left :block/pre-block? :block/uuid
              :block/level :block/title :db/id]]
      (map #(select-keys % ks) x))))

(defn blocks->vec-tree
  [blocks]
  (let [{:keys [ids parents indexed-by-position]}
        (prepare-blocks blocks)
        root-id (first (set/difference parents ids))]
    (letfn [(build-tree [root]
              (let [root (outliner-ref/wrap-refs-with-children root)
                    children (->>
                               (get-children-from-memory (:db/id root) indexed-by-position)
                               (map build-tree))]
                (if (seq children)
                  (->
                    (assoc root :block/children children)
                    (outliner-ref/wrap-refs-with-children children))
                  root)))]
      (->>
        (get-children-from-memory root-id indexed-by-position)
        (map build-tree)))))
