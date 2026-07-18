(ns frontend.modules.outliner.tree
  (:require [frontend.util.entity :as entity]
            [logseq.outliner.tree :as otree]))

(defn- block-page
  [block]
  (let [page (:block/page block)]
    (if (number? page) {:db/id page} page)))

(defn- same-root?
  [block root-id]
  (cond
    (uuid? root-id)
    (= (:block/uuid block) root-id)

    (number? root-id)
    (= (:db/id block) root-id)

    (string? root-id)
    (if-let [id (parse-uuid root-id)]
      (= (:block/uuid block) id)
      (or (= (:block/name block) root-id)
          (= (:block/title block) root-id)))

    :else
    (= (:db/id block) (:db/id root-id))))

(defn- root-block
  [blocks root-id]
  (or (some #(when (same-root? % root-id) %) blocks)
      (when-let [page (some block-page blocks)]
        (assoc page :block/uuid (or (:block/uuid page)
                                    (when (uuid? root-id) root-id)
                                    (when (and (string? root-id) (parse-uuid root-id))
                                      (parse-uuid root-id)))))))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  [blocks root-id & {:as option}]
  (let [blocks (map otree/block-entity->map blocks)]
    (if-let [root (root-block blocks root-id)]
      (otree/blocks->vec-tree-data
       blocks root
       {:include-root? (or (not (entity/page? root)) (:link option))
        :keep-block-tx-id? true})
      blocks)))

(defn- entity-key
  [entity]
  (or (:db/id entity) (:block/uuid entity)))

(defn- tree-entities
  [root]
  (tree-seq #(seq (:block/children %)) :block/children root))

(defn reconcile-block-tree
  "Apply changed and deleted entities to a loaded block tree.

  The whole tree is scanned to restore authoritative parent/order relationships,
  but unchanged subtrees retain their object identity so React only reconciles
  changed nodes and their ancestor paths."
  [root changed-entities deleted-ids]
  (if-not root
    root
    (let [old-entities (tree-entities root)
          old-by-key (into {} (map (juxt entity-key identity)) old-entities)
          aliases (into {}
                        (mapcat (fn [entity]
                                  (keep (fn [id]
                                          (when id [id (entity-key entity)]))
                                        [(:db/id entity) (:block/uuid entity)])))
                        old-entities)
          deleted-keys (into #{} (map #(get aliases % %)) deleted-ids)
          changed-by-key (into {}
                               (keep (fn [entity]
                                       (when-let [key (or (get aliases (:db/id entity))
                                                         (get aliases (:block/uuid entity))
                                                         (entity-key entity))]
                                         [key entity])))
                               changed-entities)
          entities-by-key (reduce-kv
                           (fn [result key old-entity]
                             (if (contains? deleted-keys key)
                               result
                               (assoc result key
                                      (merge (dissoc old-entity :block/children :block/level)
                                             (some-> (get changed-by-key key)
                                                     (dissoc :block/children :block/level))))))
                           {}
                           old-by-key)
          entities-by-key (reduce-kv
                           (fn [result key entity]
                             (if (or (contains? deleted-keys key)
                                     (contains? result key))
                               result
                               (assoc result key (dissoc entity :block/children :block/level))))
                           entities-by-key
                           changed-by-key)
          root-key (entity-key root)
          candidate-root (when-let [root-entity (get entities-by-key root-key)]
                           (-> (otree/blocks->vec-tree-data
                                (vals entities-by-key)
                                root-entity
                                {:include-root? true
                                 :keep-block-tx-id? true})
                               first
                               (assoc :block/level (or (:block/level root) 0))))]
      (letfn [(reuse-unchanged [candidate]
                (let [children (mapv reuse-unchanged (:block/children candidate))
                      candidate (assoc candidate :block/children children)
                      old (get old-by-key (entity-key candidate))
                      same-children? (and (= (count (:block/children old)) (count children))
                                          (every? true?
                                                  (map identical?
                                                       (:block/children old)
                                                       children)))]
                  (if (and old
                           same-children?
                           (= (dissoc old :block/children)
                              (dissoc candidate :block/children)))
                    old
                    candidate)))]
        (some-> candidate-root reuse-unchanged)))))

(defn visible-blocks
  "Return a flat DFS projection while keeping the canonical data as a tree."
  [children temporary-collapsed]
  (letfn [(walk [blocks]
            (mapcat (fn [block]
                      (let [block-id (:block/uuid block)
                            collapsed? (if (contains? temporary-collapsed block-id)
                                         (get temporary-collapsed block-id)
                                         (:block/collapsed? block))]
                        (cons (dissoc block :block/children)
                              (when-not collapsed?
                                (walk (:block/children block))))))
                    blocks))]
    (vec (walk children))))

(defn viewport-render-limit
  [root-top viewport-bottom average-height total-count initial-limit overscan-px]
  (-> (/ (+ (- viewport-bottom root-top) overscan-px) average-height)
      js/Math.ceil
      (max initial-limit)
      (min total-count)))

(defonce ^:private *resident-block-trees (atom {}))
(defonce ^:private *resident-block-tree-order (atom []))

(defn- assoc-root-aliases
  [trees root]
  (cond-> trees
    (:db/id root) (assoc (:db/id root) root)
    (:block/uuid root) (assoc (:block/uuid root) root)))

(defn resident-block-tree
  [id]
  (get @*resident-block-trees id))

(defn keep-block-tree-resident!
  [root]
  (when root
    (let [root-key (entity-key root)
          order (swap! *resident-block-tree-order
                       (fn [keys]
                         (->> (concat (remove #{root-key} keys) [root-key])
                              (take-last 2)
                              vec)))
          roots-by-key (assoc (into {}
                                    (map (juxt entity-key identity))
                                    (vals @*resident-block-trees))
                              root-key root)]
      (reset! *resident-block-trees
              (reduce (fn [trees key]
                        (if-let [resident-root (get roots-by-key key)]
                          (assoc-root-aliases trees resident-root)
                          trees))
                      {}
                      order))))
  root)

(defn reconcile-resident-block-trees!
  [changed-entities deleted-ids]
  (swap! *resident-block-trees
         (fn [trees]
           (reduce (fn [result root]
                     (let [root' (reconcile-block-tree root changed-entities deleted-ids)]
                       (if root'
                         (assoc-root-aliases result root')
                         result)))
                   {}
                   (vals (into {} (map (juxt entity-key identity)) (vals trees))))))
  nil)

(def filter-top-level-blocks otree/filter-top-level-blocks)

(def non-consecutive-blocks->vec-tree otree/non-consecutive-blocks->vec-tree)

(defn get-sorted-block-and-children
  [db db-id & {:as opts}]
  (otree/get-sorted-block-and-children db db-id opts))
