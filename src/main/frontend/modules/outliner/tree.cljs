(ns frontend.modules.outliner.tree
  (:require [frontend.util.entity :as entity]
            [logseq.db :as ldb]
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

(defn- blocks->vec-tree-data
  [blocks root option]
  (if-not (:db/id root)
    blocks
    (let [root-id (:db/id root)
          parent-blocks (group-by #(get-in % [:block/parent :db/id]) blocks)
          block-children (fn block-children [parent level]
                           (->> (get parent-blocks parent)
                                ldb/sort-by-order
                                (map (fn [block]
                                       (let [id (:db/id block)
                                             children (-> (block-children id (inc level))
                                                          ldb/sort-by-order)]
                                         (assoc block
                                                :block/level level
                                                :block/children children
                                                :block/parent {:db/id parent}))))))]
      (if (and (entity/page? root) (not (:link option)))
        (block-children root-id 1)
        [(assoc root :block/children (block-children root-id 1))]))))

(defn blocks->vec-tree
  "`blocks` need to be in the same page."
  ([blocks root-id]
   (blocks->vec-tree nil blocks root-id))
  ([_repo blocks root-id & {:as option}]
   (let [blocks (map otree/block-entity->map blocks)]
     (if-let [root (root-block blocks root-id)]
       (blocks->vec-tree-data blocks root option)
       blocks))))

(def filter-top-level-blocks otree/filter-top-level-blocks)

(def non-consecutive-blocks->vec-tree otree/non-consecutive-blocks->vec-tree)

(defn get-sorted-block-and-children
  [db db-id & {:as opts}]
  (otree/get-sorted-block-and-children db db-id opts))
