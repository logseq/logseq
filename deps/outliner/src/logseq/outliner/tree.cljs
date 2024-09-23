(ns logseq.outliner.tree
  "Provides tree fns and INode protocol"
  (:require [logseq.db :as ldb]
            [logseq.db.frontend.property.util :as db-property-util]
            [datascript.core :as d]
            [datascript.impl.entity :as de]))

(defprotocol INode
  (-save [this txs-state conn repo date-formatter opts])
  (-del [this db conn]))

(defn- blocks->vec-tree-aux
  [repo db blocks root]
  (let [root-id (:db/id root)
        blocks (remove #(db-property-util/shape-block? repo db %) blocks)
        parent-blocks (group-by #(get-in % [:block/parent :db/id]) blocks) ;; exclude whiteboard shapes
        sort-fn (fn [parent]
                  (when-let [children (get parent-blocks parent)]
                    (ldb/sort-by-order children)))
        block-children (fn block-children [parent level]
                         (map (fn [m]
                                (let [id (:db/id m)
                                      children (-> (block-children id (inc level))
                                                   (ldb/sort-by-order))]
                                  (->
                                   (assoc m
                                          :block/level level
                                          :block/children children
                                          :block/parent {:db/id parent})
                                   (dissoc :block/tx-id))))
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

;; TODO: entity can already be used as a tree
(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  [repo db blocks root-id]
  (let [blocks (map (fn [b] (if (de/entity? b)
                              (assoc (into {} b) :db/id (:db/id b))
                              b)) blocks)
        [page? root] (get-root-and-page db root-id)]
    (if-not root ; custom query
      blocks
      (let [result (blocks->vec-tree-aux repo db blocks root)]
        (if page?
          result
          ;; include root block
          (let [root-block (some #(when (= (:db/id %) (:db/id root)) %) blocks)
                root-block (-> (assoc root-block :block/children result)
                               (dissoc :block/tx-id))]
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
                            (ldb/sort-by-order)))))
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
         top-level-blocks' (ldb/sort-by-order top-level-blocks)
         parent->children (group-by :block/parent blocks)]
     (map #(tree parent->children % (or default-level 1)) top-level-blocks'))))

(defn get-sorted-block-and-children
  [db db-id & {:as opts}]
  (when db-id
    (when-let [root-block (d/entity db db-id)]
      (ldb/get-block-and-children db (:block/uuid root-block) opts))))
