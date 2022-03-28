(ns frontend.handler.block
  (:require [clojure.set :as set]
            [clojure.walk :as walk]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.react :as db-react]
            [frontend.state :as state]
            [frontend.format.block :as block]
            [frontend.util :as util]))

;; lazy loading

(def initial-blocks-length 50)

(def step-loading-blocks 50)

;;  Fns

(defn long-page?
  [repo page-id]
  (>= (db/get-page-blocks-count repo page-id) initial-blocks-length))

(defn get-block-refs-with-children
  [block]
  (->>
   (tree-seq :block/refs
             :block/children
             block)
   (mapcat :block/refs)
   (distinct)))

(defn filter-blocks
  [repo ref-blocks filters group-by-page?]
  (let [ref-pages-ids (->> (if group-by-page?
                             (mapcat last ref-blocks)
                             ref-blocks)
                           (mapcat (fn [b] (get-block-refs-with-children b)))
                           (concat (when group-by-page? (map first ref-blocks)))
                           (distinct)
                           (map :db/id)
                           (remove nil?))
        ref-pages (db/pull-many repo '[:db/id :block/name] ref-pages-ids)
        ref-pages (zipmap (map :block/name ref-pages) (map :db/id ref-pages))
        exclude-ids (->> (map (fn [page] (get ref-pages page)) (get filters false))
                         (remove nil?)
                         (set))
        include-ids (->> (map (fn [page] (get ref-pages page)) (get filters true))
                         (remove nil?)
                         (set))]
    (if (empty? filters)
      ref-blocks
      (let [filter-f (fn [ref-blocks]
                       (cond->> ref-blocks
                         (seq exclude-ids)
                         (remove (fn [block]
                                   (let [ids (set (concat (map :db/id (get-block-refs-with-children block))
                                                          [(:db/id (:block/page block))]))]
                                     (seq (set/intersection exclude-ids ids)))))

                         (seq include-ids)
                         (remove (fn [block]
                                   (let [page-block-id (:db/id (:block/page block))
                                         ids (set (map :db/id (get-block-refs-with-children block)))]
                                     (if (and (contains? include-ids page-block-id)
                                              (= 1 (count include-ids)))
                                       (not= page-block-id (first include-ids))
                                       (empty? (set/intersection include-ids (set (conj ids page-block-id))))))))))]
        (if group-by-page?
          (->> (map (fn [[p ref-blocks]]
                      [p (filter-f ref-blocks)]) ref-blocks)
               (remove #(empty? (second %))))
          (->> (filter-f ref-blocks)
               (remove nil?)))))))

;; TODO: reduced version
(defn- walk-block
  [block check? transform]
  (let [result (atom nil)]
    (walk/postwalk
     (fn [x]
       (if (check? x)
         (reset! result (transform x))
         x))
     (:block/body block))
    @result))

(defn get-timestamp
  [block typ]
  (walk-block block
              (fn [x]
                (and (block/timestamp-block? x)
                     (= typ (first (second x)))))
              #(second (second %))))

(defn get-scheduled-ast
  [block]
  (get-timestamp block "Scheduled"))

(defn get-deadline-ast
  [block]
  (get-timestamp block "Deadline"))

(defn load-more!
  [db-id start-id]
  (let [repo (state/get-current-repo)
        block (db/entity repo db-id)
        block? (not (:block/name block))
        k (if block?
            :frontend.db.react/block-and-children
            :frontend.db.react/page-blocks)
        query-k [repo k db-id]
        option (cond-> {:limit step-loading-blocks}
                 block?
                 (assoc :scoped-block-id db-id))
        more-data (db-model/get-paginated-blocks-no-cache start-id option)]
    (db-react/swap-new-result! query-k
                               (fn [result]
                                 (->> (concat result more-data)
                                      (util/distinct-by :db/id))))))
