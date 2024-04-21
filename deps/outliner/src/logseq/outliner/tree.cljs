(ns logseq.outliner.tree
  "Provides tree fns and INode protocol"
  (:require [logseq.db :as ldb]
            [logseq.db.frontend.property.util :as db-property-util]
            [datascript.core :as d]))

(defprotocol INode
  (-get-id [this conn])
  (-get-parent-id [this conn])
  (-get-left-id [this conn])
  (-set-left-id [this left-id conn])
  (-get-parent [this conn])
  (-get-left [this conn])
  (-get-right [this conn])
  (-get-down [this conn])
  (-save [this txs-state conn repo date-formatter opts])
  (-del [this db conn])
  (-get-children [this conn]))

(defn satisfied-inode?
  [node]
  (satisfies? INode node))

(defn- blocks->vec-tree-aux
  [repo db blocks root]
  (let [root-id (:db/id root)
        blocks (remove #(db-property-util/shape-block? repo db %) blocks)
        parent-blocks (group-by #(get-in % [:block/parent :db/id]) blocks) ;; exclude whiteboard shapes
        sort-fn (fn [parent]
                  (when-let [children (get parent-blocks parent)]
                    (ldb/sort-by-left children {:db/id parent})))
        block-children (fn block-children [parent level]
                         (map (fn [m]
                                (let [id (:db/id m)
                                      children (-> (block-children id (inc level))
                                                   (ldb/sort-by-left m))]
                                  (assoc m
                                         :block/level level
                                         :block/children children)))
                              (sort-fn parent)))]
    (block-children root-id 1)))

(defn- get-root-and-page
  [db root-id]
  (cond
    (uuid? root-id)
    (let [e (d/entity db [:block/uuid root-id])]
      (if (ldb/page? e) [true e] [false e]))

    (number? root-id)
    (let [e (d/entity db root-id)]
      (if (ldb/page? e) [true e] [false e]))

    (string? root-id)
    (if-let [id (parse-uuid root-id)]
      [false (d/entity db [:block/uuid id])]
      [true (ldb/get-page db root-id)])

    :else
    [false root-id]))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  [repo db blocks root-id]
  (let [[page? root] (get-root-and-page db root-id)]
    (if-not root ; custom query
      blocks
      (let [result (blocks->vec-tree-aux repo db blocks root)]
        (if page?
          result
           ;; include root block
          (let [root-block (some #(when (= (:db/id %) (:db/id root)) %) blocks)
                root-block (assoc root-block :block/children result)]
            [root-block]))))))

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
                            (ldb/try-sort-by-left parent)))))
        children (nodes root-id 1)
        root' (assoc root :block/level (or default-level 1))]
    (if (seq children)
      (assoc root' :block/children children)
      root')))

(defn ^:api block-entity->map
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

(defn ^:api filter-top-level-blocks
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
         top-level-blocks' (ldb/try-sort-by-left top-level-blocks (:block/parent (first top-level-blocks)))
         parent->children (group-by :block/parent blocks)]
     (map #(tree parent->children % (or default-level 1)) top-level-blocks'))))

(defn- sort-blocks-aux
  [parents parent-groups]
  (mapv (fn [parent]
          (let [parent-id {:db/id (:db/id parent)}
                children (ldb/sort-by-left (get @parent-groups parent-id) parent)
                _ (swap! parent-groups #(dissoc % parent-id))
                sorted-nested-children (when (not-empty children) (sort-blocks-aux children parent-groups))]
                    (if sorted-nested-children [parent sorted-nested-children] [parent])))
        parents))

(defn ^:api sort-blocks
  "sort blocks by parent & left"
  [blocks-exclude-root root]
  (let [parent-groups (atom (group-by :block/parent blocks-exclude-root))]
    (flatten (concat (sort-blocks-aux [root] parent-groups) (vals @parent-groups)))))

(defn get-sorted-block-and-children
  [repo db db-id]
  (when db-id
    (when-let [root-block (d/pull db '[*]  db-id)]
      (let [blocks (ldb/get-block-and-children repo db (:block/uuid root-block))
            blocks-exclude-root (remove (fn [b] (= (:db/id b) db-id)) blocks)]
        (sort-blocks blocks-exclude-root root-block)))))
