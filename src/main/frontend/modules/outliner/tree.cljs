(ns frontend.modules.outliner.tree
  (:require [frontend.db :as db]
            [frontend.db.model :as model]
            [clojure.string :as string]
            [frontend.state :as state]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]))

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
        blocks (remove gp-whiteboard/shape-block? blocks)
        parent-blocks (group-by :block/parent blocks) ;; exclude whiteboard shapes
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

(defn- tree [parent->children root default-level]
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
        root' (assoc root :block/level (or default-level 1))]
    (if (seq children)
      (assoc root' :block/children children)
      root')))

(defn block-entity->map
  [e]
  (cond-> {:db/id (:db/id e)
           :block/uuid (:block/uuid e)
           :block/parent {:db/id (:db/id (:block/parent e))}
           :block/page (:block/page e)}
    (:db/id (:block/left e))
    (assoc :block/left {:db/id (:db/id (:block/left e))})
    (:block/refs e)
    (assoc :block/refs (:block/refs e))
    (:block/children e)
    (assoc :block/children (:block/children e))))

(defn filter-top-level-blocks
  [blocks]
  (let [id->blocks (zipmap (map :db/id blocks) blocks)]
    (filter #(nil?
              (id->blocks
               (:db/id (:block/parent (id->blocks (:db/id %)))))) blocks)))

(defn non-consecutive-blocks->vec-tree
  "`blocks` need to be in the same page."
  ([blocks]
   (non-consecutive-blocks->vec-tree blocks 1))
  ([blocks default-level]
   (let [blocks (map block-entity->map blocks)
         top-level-blocks (filter-top-level-blocks blocks)
         top-level-blocks' (model/try-sort-by-left top-level-blocks (:block/parent (first top-level-blocks)))
         parent->children (group-by :block/parent blocks)]
     (map #(tree parent->children % (or default-level 1)) top-level-blocks'))))

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
          ; the root-block returned by db/pull misses :block/_refs therefore we use the one from db/get-block-and-children
          root-block (first (filter (fn [b] (= (:db/id b) db-id)) blocks))
          blocks-exclude-root (remove (fn [b] (= (:db/id b) db-id)) blocks)]
      (sort-blocks blocks-exclude-root root-block))))
