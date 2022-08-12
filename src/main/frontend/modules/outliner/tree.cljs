(ns frontend.modules.outliner.tree
  (:require [frontend.db :as db]
            [frontend.db.model :as model]
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
    (if-let [id (parse-uuid root-id)]
      [false (db/entity repo [:block/uuid id])]
      [true (db/entity repo [:block/name (string/lower-case root-id)])])
    [false root-id]))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
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

(defn- tree [parent->children root]
  (let [root-id (:db/id root)
        nodes (fn nodes [parent-id level]
                (mapv (fn [b]
                        (let [b' (assoc b :block/level (inc level))
                              children (nodes (:db/id b) (inc level))]
                          (if (seq children)
                            (assoc b' :block/children children)
                            b')))
                      (let [parent {:db/id parent-id}]
                        (-> (get parent->children parent)
                            (model/try-sort-by-left parent)))))
        children (nodes root-id 1)
        root' (assoc root :block/level 1)]
    (if (seq children)
      (assoc root' :block/children children)
      root')))

(defn non-consecutive-blocks->vec-tree
  "`blocks` need to be in the same page."
  [blocks]
  (let [blocks (map (fn [e] {:db/id (:db/id e)
                             :block/uuid (:block/uuid e)
                             :block/parent {:db/id (:db/id (:block/parent e))}
                             :block/left {:db/id (:db/id (:block/left e))}
                             :block/page {:db/id (:db/id (:block/page e))}}) blocks)
        parent->children (group-by :block/parent blocks)
        id->blocks (zipmap (map :db/id blocks) blocks)
        top-level-blocks (filter #(nil?
                                   (id->blocks
                                    (:db/id (:block/parent (id->blocks (:db/id %)))))) blocks)
        top-level-blocks' (model/try-sort-by-left top-level-blocks (:block/parent (first top-level-blocks)))]
    (map #(tree parent->children %) top-level-blocks')))

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

(defn get-sorted-block-and-children
  [repo db-id]
  (when-let [root-block (db/pull db-id)]
    (let [blocks (db/get-block-and-children repo (:block/uuid root-block))
          blocks-exclude-root (remove (fn [b] (= (:db/id b) db-id)) blocks)]
      (sort-blocks blocks-exclude-root root-block))))
