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

(def filter-top-level-blocks otree/filter-top-level-blocks)

(def non-consecutive-blocks->vec-tree otree/non-consecutive-blocks->vec-tree)

(defn get-sorted-block-and-children
  [db db-id & {:as opts}]
  (otree/get-sorted-block-and-children db db-id opts))
