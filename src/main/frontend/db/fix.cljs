(ns frontend.db.fix
  "DB validation and fix.
  For pages:
  1. Each block should has a unique [:block/parent :block/left] position.
  2. For any block, its children should be connected by :block/left (no broken chain, no circle, no left to self)."
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]))

(defn- fix-parent-broken-chain
  [db parent-id]
  (let [parent (db/entity parent-id)
        parent-id (:db/id parent)
        blocks (:block/_parent parent)]
    (when (seq blocks)
      (let [children-ids (set (map :db/id blocks))
            sorted (db-model/sort-by-left blocks parent)
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
            (util/pprint error-data)
            (notification/show!
             [:div
              (str "Broken chain detected:\n" error-data)]
             :error
             false))
          (let [first-child-id (:db/id (db-model/get-by-parent-&-left db parent-id parent-id))
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
                                                      (when-let [left-id (:db/id (:block/left (db/entity (first current-section))))]
                                                        (swap! *ids disj left-id)
                                                        (when (and
                                                               (not (contains? (set current-section) left-id)) ; circle
                                                               (contains? children-ids left-id))
                                                          (vec (cons left-id current-section))))
                                                      current-section)
                                   section-with-right (or
                                                       (when-let [right-id (:db/id (db-model/get-right-sibling db (last section-with-left)))]
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
  [conflicts]
  (when (seq conflicts)
    (prn :debug "Parent left id conflicts:")
    (notification/show!
     [:div
      (str "Parent-left conflicts detected:\n"
           conflicts)]
     :error
     false))
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
           right-tx (when-let [right (db-model/get-right-sibling (db/get-db) (:db/id first-item))]
                      [{:db/id (:db/id right)
                        :block/left (:db/id (last items))}])]
       (concat tx right-tx)))
   conflicts))

(defn get-conflicts
  [db page-id]
  (let [parent-left->es (build-parent-left->es db page-id)]
    (filter #(> (count (second %)) 1) parent-left->es)))

(defn loop-fix-conflicts
  [repo db page-id transact-opts]
  (let [conflicts (get-conflicts db page-id)
        fix-conflicts-tx (when (seq conflicts)
                           (fix-parent-left-conflicts conflicts))]
    (when (seq fix-conflicts-tx)
      (prn :debug :conflicts-tx)
      (util/pprint fix-conflicts-tx)
      (db/transact! repo fix-conflicts-tx transact-opts)
      (let [db (db/get-db repo)]
        (when (seq (get-conflicts db page-id))
          (loop-fix-conflicts repo db page-id transact-opts))))))

(defn fix-page-if-broken!
  "Fix the page if it has either parent-left conflicts or broken chains."
  [db page-id {:keys [fix-parent-left? fix-broken-chain? replace-tx?]
            :or {fix-parent-left? true
                 fix-broken-chain? true
                 replace-tx? false}
            :as _opts}]
  (let [repo (state/get-current-repo)
        transact-opts (if replace-tx? {:replace? true} {})]
    (when fix-parent-left?
      (loop-fix-conflicts repo db page-id transact-opts))
    (when fix-broken-chain?
      (let [db' (db/get-db)
            parent-left->es' (build-parent-left->es (db/get-db) page-id)
            fix-broken-chain-tx (fix-broken-chain db' parent-left->es')]
        (when (seq fix-broken-chain-tx)
          (db/transact! repo fix-broken-chain-tx transact-opts))))))
