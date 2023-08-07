(ns frontend.db.validate
  "DB validation.
  For pages:
  1. Each block should has a unique [:block/parent :block/left] position.
  2. For any block, its children should be connected by :block/left."
  (:require [datascript.core :as d]
            [medley.core :as medley]))

(defn- broken-chain?
  [page parent-left->eid]
  (let [parents (->> (:block/_page page)
                     (filter #(seq (:block/_parent %)))
                     (cons page))]
    (some
     (fn [parent]
       (let [parent-id (:db/id parent)
             blocks (:block/_parent parent)]
         (when (seq blocks)
           (when-let [start (parent-left->eid [parent-id parent-id])]
             (let [chain (loop [current start
                                chain [start]]
                           (let [next (parent-left->eid [parent-id current])]
                             (if next
                               (recur next (conj chain next))
                               chain)))]
               (when (not= (count chain) (count blocks))
                 {:parent parent
                  :chain chain
                  :broken-blocks (remove (set chain) (map :db/id blocks))
                  :blocks blocks}))))))
     parents)))

(defn broken-page?
  "Whether `page` is broken."
  [db page-id]
  (let [parent-left-f (fn [b]
                        [(get-in b [:block/parent :db/id])
                         (get-in b [:block/left :db/id])])
        page (d/entity db page-id)
        blocks (:block/_page page)
        parent-left->es (->> (group-by parent-left-f blocks)
                             (remove (fn [[k _v]] (= k [nil nil])))
                             (into {}))
        conflicted (filter #(> (count (second %)) 1) parent-left->es)]
    (if (seq conflicted)
      [:conflict-parent-left conflicted]

      (let [parent-left->eid (medley/map-vals (fn [c] (:db/id (first c))) parent-left->es)]
        (if-let [result (broken-chain? page parent-left->eid)]
          [:broken-chain result]
          false)))))
