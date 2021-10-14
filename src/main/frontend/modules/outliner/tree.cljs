(ns frontend.modules.outliner.tree
  (:require [frontend.db :as db]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [clojure.zip :as zip]))

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

(defn vec-tree->block-tree [tree]
  "
{:id 1
 :block/children [{:id 2} {:id 3}]}
->
[{:id 1}
 [{:id 2}
  {:id 3}]]
"
  (let [loc (zip/vector-zip tree)]
    (loop [loc loc]
      (if (zip/end? loc)
        (zip/root loc)
        (cond
          (map? (zip/node loc))
          (let [block (zip/node loc)
                children (:block/children block)
                block* (dissoc block :block/children)
                loc*
                (cond-> loc
                  true (zip/replace block*)
                  (seq children) (-> (zip/insert-right (vec children))
                                       (zip/next))
                  true (zip/next))]
            (recur loc*))

          :else
          (recur (zip/next loc)))))))

(defn block-tree-keep-props [tree props]
  (let [loc (zip/vector-zip tree)
        props (set props)]
    (loop [loc loc]
      (if (zip/end? loc)
        (zip/root loc)
        (cond
          (map? (zip/node loc))
          (let [block (zip/node loc)]
            (recur (zip/next (zip/replace loc (select-keys block props)))))
          :else
          (recur (zip/next loc)))))))

(defn- get-left [id]
  (:block/uuid (:block/left (db/entity [:block/uuid id]))))

(defn- get-parent [id]
  (:block/uuid (:block/parent (db/entity [:block/uuid id]))))

(defn- get-right [id]
  (let [left-id id
        parent-id (:block/uuid (:block/parent (db/entity [:block/uuid id])))]
    (:block/uuid
     (db-outliner/get-by-parent-&-left
      (conn/get-conn false)
      [:block/uuid parent-id]
      [:block/uuid left-id]))))

(defn- get-next-upper-level-id [id]
  (when-some [parent-id (:block/uuid (:block/parent (db/entity [:block/uuid id])))]
    (if-some [next (get-right parent-id)]
      next
      (get-next-upper-level-id parent-id))))

(defn- get-right-or-next-upper-level-id [id]
  (or (get-right id) (get-next-upper-level-id id)))

(defn range-uuids->block-tree [start-uuid end-uuid]
  "return [{:left-id left-id :sibling? bool :tree block-tree}]"
  (let [current-repo (state/get-current-repo)]
    (if (= start-uuid end-uuid)
      (->
       (db/get-block-and-children current-repo start-uuid)
       (blocks->vec-tree start-uuid)
       (vec-tree->block-tree))
      (loop [uuid start-uuid result [] new-tree? true]
        (let [blocks (->
                        (db/get-block-and-children current-repo uuid)
                        (blocks->vec-tree uuid)
                        (vec-tree->block-tree))]
          (if new-tree?
            (let [parent-id (get-parent uuid)
                  left-id (get-left uuid)
                  sibling? (not= parent-id left-id)
                  item {:left-id left-id :sibling? sibling? :tree []}
                  tree (transient [])]
              (doseq [b blocks] (conj! tree b))
              (let [item (assoc item :tree (persistent! tree))
                    result (conj result item)]
                (if (not= uuid end-uuid)
                  (if-some [right-id (get-right uuid)]
                    (recur right-id result false)
                    (if-some [next-upper-id (get-next-upper-level-id uuid)]
                      (recur next-upper-id result true)
                      result))
                  result)))
            (let [last-item (last result)
                  tree (transient (:tree last-item))]
              (doseq [b blocks] (conj! tree b))
              (let [last-item (assoc last-item :tree (persistent! tree))
                    result (conj (vec (butlast result)) last-item)]
                (if (not= uuid end-uuid)
                  (if-some [right-id (get-right uuid)]
                    (recur right-id result false)
                    (if-some [next-upper-id (get-next-upper-level-id uuid)]
                      (recur next-upper-id result true)
                      result))
                  result)))))))))

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
