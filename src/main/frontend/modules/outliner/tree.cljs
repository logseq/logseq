(ns frontend.modules.outliner.tree
  (:require [frontend.db :as db]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.state :as state]))

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

(defn- blocks->vec-tree-aux
  [blocks root]
  (let [id-map (fn [m] {:db/id (:db/id m)})
        root (id-map root)
        parent-blocks (group-by :block/parent blocks)
        sort-fn (fn [parent]
                  (db/sort-by-left (get parent-blocks parent) parent))
        block-children (fn block-children [parent level]
                         (map (fn [m]
                                (let [parent (id-map m)
                                      children (-> (block-children parent (inc level))
                                                   (db/sort-by-left parent))]
                                  (assoc m
                                         :block/level level
                                         :block/children children)))
                           (sort-fn parent)))]
    (block-children root 1)))

(defn- get-root-and-page
  [repo root-id]
  (if (string? root-id)
    (if (util/uuid-string? root-id)
      [false (db/entity repo [:block/uuid (uuid root-id)])]
      [true (db/entity repo [:block/name (string/lower-case root-id)])])
    [false root-id]))

(defn blocks->vec-tree
  ([blocks root-id]
   (blocks->vec-tree (state/get-current-repo) blocks root-id))
  ([repo blocks root-id]
   (let [[page? root] (get-root-and-page repo (str root-id))]
     (if-not root ; custom query
       blocks
       (let [result (blocks->vec-tree-aux blocks root)]
         (if page?
           result
           ;; include root block
           (let [root-block (some #(when (= (:db/id %) (:db/id root)) %) blocks)
                 root-block (assoc root-block :block/children result)]
             [root-block])))))))

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

(defn blocks-with-level
  "`blocks` should be sorted already."
  [blocks]
  (let [level->block (atom {})]
    (loop [blocks blocks
           result []]
      (if-let [block (first blocks)]
        (let [parent-id (:db/id (:block/parent block))
              parent-level (get @level->block parent-id)
              level' (inc (or parent-level 0))
              block (assoc block :block/level level')]
          (when-not parent-level
            (swap! level->block assoc parent-id parent-level))
          (swap! level->block assoc (:db/id block) level')
          (recur (rest blocks) (conj result block)))
        result))))
