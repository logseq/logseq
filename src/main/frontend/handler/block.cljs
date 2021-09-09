(ns frontend.handler.block
  (:require [clojure.set :as set]
            [clojure.walk :as walk]
            [frontend.db :as db]
            [frontend.format.block :as block]))

(defn get-block-ids
  [block]
  (let [ids (atom [])
        _ (walk/prewalk
           (fn [form]
             (when (map? form)
               (when-let [id (:block/uuid form)]
                 (swap! ids conj id)))
             form)
           block)]
    @ids))

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
  (let [ref-pages (->> (if group-by-page?
                         (mapcat last ref-blocks)
                         ref-blocks)
                       (mapcat (fn [b] (get-block-refs-with-children b)))
                       (concat (when group-by-page? (map first ref-blocks)))
                       (distinct)
                       (map :db/id)
                       (db/pull-many repo '[:db/id :block/name]))
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
(defn walk-block
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
