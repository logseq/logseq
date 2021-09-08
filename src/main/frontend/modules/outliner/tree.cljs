(ns frontend.modules.outliner.tree
  (:require [frontend.db :as db]
            [frontend.util :as util]))

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

  (-save [this db])
  (-del [this db children?])
  (-get-children [this]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

(defn- get-children
  [blocks parent]
  (let [children (doall
                  (-> (filter #(= (:block/parent %) {:db/id (:db/id parent)}) @blocks)
                      (db/sort-by-left parent)))]
    (reset! blocks (remove (set children) @blocks))
    children))

(defn- with-children
  [block children]
  (assoc block :block/children children))

(defn- blocks->vec-tree-aux
  ([blocks root]
   (blocks->vec-tree-aux blocks root 1))
  ([blocks root level]
   (let [root {:db/id (:db/id root)}]
     (some->>
      (get-children blocks root)
      (map (fn [block]
             (let [block (assoc block :block/level level)
                   children (blocks->vec-tree-aux blocks block (inc level))]
               (with-children block children))))))))

(defn- get-root-and-page
  [root-id]
  (if (string? root-id)
    (if (util/uuid-string? root-id)
      [false (db/entity [:block/uuid (uuid root-id)])]
      [true (or (db/entity [:block/name root-id])
                (db/entity [:block/original-name root-id]))])
    [false root-id]))

(defn blocks->vec-tree
  [blocks root-id]
  (let [original-blocks blocks
        blocks (atom blocks)
        [page? root] (get-root-and-page (str root-id))
        result (blocks->vec-tree-aux blocks root)]
    (cond
      (not root)                        ; custom query
      original-blocks

      page?
      result

      :else                             ; include root block
      (let [root-block (some #(when (= (:db/id %) (:db/id root)) %) @blocks)
            root-block (with-children root-block result)]
        [root-block]))))

(defn- sort-blocks-aux
  [parents parent-groups]
  (mapv (fn [parent]
          (let [parent-id {:db/id (:db/id parent)}
                children (db/sort-by-left (get @parent-groups parent-id) parent)
                _ (swap! parent-groups #(dissoc % parent-id))
                sorted-nested-children (when (not-empty children) (sort-blocks-aux children parent-groups))]
                    (if sorted-nested-children [parent sorted-nested-children] [parent])))
        parents))

(defn sort-blocks
  "sort blocks by parent & left"
  [blocks-exclude-root root]
  (let [parent-groups (atom (group-by :block/parent blocks-exclude-root))]
    (flatten (concat (sort-blocks-aux [root] parent-groups) (vals @parent-groups)))))
