(ns frontend.worker.db.fix
  "DB validation and fix.
  For pages:
  1. Each block should has a unique [:block/parent :block/left] position.
  2. For any block, its children should be connected by :block/left (no broken chain, no circle, no left to self)."
  (:require [datascript.core :as d]
            [cljs.pprint :as pprint]
            [logseq.db :as ldb]
            [frontend.worker.util :as util]))

(defn- fix-parent-broken-chain
  [db parent-id]
  (let [parent (d/entity db parent-id)
        parent-id (:db/id parent)
        blocks (:block/_parent parent)]
    (when (seq blocks)
      (let [children-ids (set (map :db/id blocks))
            sorted (ldb/sort-by-left blocks parent)
            broken-chain? (not= (count sorted) (count blocks))]
        (when broken-chain?
          (let [error-data {:parent {:db/id parent-id
                                     :block/uuid (:block/uuid parent)
                                     :block/content (:block/content parent)}
                            :children (mapv (fn [b]
                                              {:db/id (:db/id b)
                                               :block/content (:block/content b)
                                               :block/left (:db/id (:block/left b))}) blocks)}]
            (prn :debug "Broken chain:")
            (pprint/pprint error-data)
            (util/post-message :notification
                               (pr-str [[:div
                                         (str "Broken chain detected:\n" error-data)]
                                        :error])))
          (let [first-child-id (:db/id (ldb/get-by-parent-&-left db parent-id parent-id))
                *ids (atom children-ids)
                sections (loop [sections []]
                           (if (seq @*ids)
                             (let [last-section (last sections)
                                   current-section (if (seq (last sections))
                                                     last-section
                                                     (if (and (empty? sections) first-child-id)
                                                       (do
                                                         (swap! *ids disj first-child-id)
                                                         [first-child-id])
                                                       (let [id (first @*ids)]
                                                         (swap! *ids disj id)
                                                         [id])))
                                   section-with-left (or
                                                      (when-let [left-id (:db/id (:block/left (d/entity db (first current-section))))]
                                                        (swap! *ids disj left-id)
                                                        (when (and
                                                               (not (contains? (set current-section) left-id)) ; circle
                                                               (contains? children-ids left-id))
                                                          (vec (cons left-id current-section))))
                                                      current-section)
                                   section-with-right (or
                                                       (when-let [right-id (:db/id (ldb/get-right-sibling db (last section-with-left)))]
                                                         (swap! *ids disj right-id)
                                                         (when (and (not (contains? (set section-with-left) right-id)) ; circle
                                                                    (contains? children-ids right-id))
                                                           (conj section-with-left right-id)))
                                                       section-with-left)
                                   new-sections (cond
                                                  (empty? last-section)
                                                  (conj (vec (butlast sections)) section-with-right)

                                                  (= section-with-right current-section)
                                                  (conj sections [])

                                                  :else
                                                  (conj (vec (butlast sections)) section-with-right))]
                               (recur new-sections))
                             sections))]
            (->>
             (map-indexed
              (fn [idx section]
                (map-indexed
                 (fn [idx' item]
                   (let [m {:db/id item}
                         left (cond
                                (and (zero? idx) (zero? idx'))
                                parent-id

                                (and (not (zero? idx)) (zero? idx')) ; first one need to connected to the last section
                                (last (nth sections (dec idx)))

                                (> idx' 0)
                                (nth section (dec idx')))]
                     (assoc m :block/left left)))
                 section))
              sections)
             (apply concat))))))))

(defn- fix-broken-chain
  [db parent-left->es]
  (let [parents (distinct (map first (keys parent-left->es)))]
    (mapcat #(fix-parent-broken-chain db %) parents)))

(defn- build-parent-left->es
  [db page-id]
  (let [parent-left-f (fn [b]
                        [(get-in b [:block/parent :db/id])
                         (get-in b [:block/left :db/id])])
        page (d/entity db page-id)
        blocks (:block/_page page)]
    (->> (group-by parent-left-f blocks)
         (remove (fn [[k _v]] (= k [nil nil])))
         (into {}))))

(defn- fix-parent-left-conflicts
  [db conflicts]
  (when (seq conflicts)
    (prn :debug "Parent left id conflicts:")
    (util/post-message :notification (pr-str [[:div
                                               (str "Parent-left conflicts detected:\n"
                                                    conflicts)]
                                              :error])))
  (mapcat
   (fn [[_parent-left blocks]]
     (let [items (sort-by :block/created-at blocks)
           [first-item & others] items
           tx (map-indexed
               (fn [idx other]
                 {:db/id (:db/id other)
                  :block/left (:db/id (nth items (if (zero? idx) idx (dec idx))))
                  :block/parent (:db/id (:block/parent first-item))})
               others)
           right-tx (when-let [right (ldb/get-right-sibling db (:db/id first-item))]
                      [{:db/id (:db/id right)
                        :block/left (:db/id (last items))}])]
       (concat tx right-tx)))
   conflicts))

(defn get-conflicts
  [db page-id]
  (let [parent-left->es (build-parent-left->es db page-id)]
    (filter #(> (count (second %)) 1) parent-left->es)))

(defn- loop-fix-conflicts
  [conn page-id transact-opts *fix-tx-data]
  (let [db @conn
        conflicts (get-conflicts db page-id)
        fix-conflicts-tx (when (seq conflicts)
                           (fix-parent-left-conflicts db conflicts))]
    (when (seq fix-conflicts-tx)
      (prn :debug :conflicts-tx)
      (pprint/pprint fix-conflicts-tx)
      (let [tx-data (:tx-data (ldb/transact! conn fix-conflicts-tx transact-opts))]
        (swap! *fix-tx-data (fn [old-data] (concat old-data tx-data))))
      (when (seq (get-conflicts @conn page-id))
        (loop-fix-conflicts conn page-id transact-opts *fix-tx-data)))))

(defn fix-page-if-broken!
  "Fix the page if it has either parent-left conflicts or broken chains."
  [conn page-id {:keys [fix-parent-left? fix-broken-chain? replace-tx?]
                 :or {fix-parent-left? true
                      fix-broken-chain? true
                      replace-tx? false}
                 :as _opts}]
  (let [db @conn
        page (d/entity db page-id)]
    (when-not (or (ldb/whiteboard-page? db page)
                  (ldb/hidden-page? page))
      (let [transact-opts (if replace-tx? {:replace? true} {})
            *fix-tx-data (atom [])]
        (when fix-parent-left?
          (loop-fix-conflicts conn page-id transact-opts *fix-tx-data))
        (when fix-broken-chain?
          (let [db' @conn
                parent-left->es' (build-parent-left->es db page-id)
                fix-broken-chain-tx (fix-broken-chain db' parent-left->es')]
            (when (seq fix-broken-chain-tx)
              (let [tx-data (:tx-data (ldb/transact! conn fix-broken-chain-tx transact-opts))]
                (swap! *fix-tx-data (fn [old-data] (concat old-data tx-data)))))))
        @*fix-tx-data))))
