(ns frontend.handler.block
  (:require [frontend.util :as util]
            [clojure.walk :as walk]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.format.mldoc :as mldoc]
            [frontend.date :as date]
            [frontend.config :as config]
            [datascript.core :as d]
            [clojure.set :as set]
            [medley.core :as medley]
            [frontend.format.block :as block]
            [frontend.debug :as debug]
            [clojure.string :as string]))

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

(defn collapse-block!
  [block]
  (let [repo (:block/repo block)]
    (db/transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? true}])))

(defn collapse-blocks!
  [block-ids]
  (let [repo (state/get-current-repo)]
    (db/transact! repo
      (map
        (fn [id]
          {:block/uuid id
           :block/collapsed? true})
        block-ids))))

(defn expand-block!
  [block]
  (let [repo (:block/repo block)]
    (db/transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? false}])))

(defn expand-blocks!
  [block-ids]
  (let [repo (state/get-current-repo)]
    (db/transact! repo
      (map
        (fn [id]
          {:block/uuid id
           :block/collapsed? false})
        block-ids))))

;; TODO: should we remove this dummy block and use the page's root block instead?
(defn with-dummy-block
  ([blocks format]
   (with-dummy-block blocks format {} {}))
  ([blocks format default-option {:keys [journal? page-name]
                                  :or {journal? false}}]
   (let [format (or format (state/get-preferred-format) :markdown)
         blocks (vec blocks)]
     (if (seq blocks)
       blocks
       (let [page-block (when page-name (db/entity [:block/name (string/lower-case page-name)]))
             page-id {:db/id (:db/id page-block)}
             dummy (merge {:block/uuid (db/new-block-id)
                           :block/left page-id
                           :block/parent page-id
                           :block/title ""
                           :block/content ""
                           :block/format format
                           :block/dummy? true}
                          default-option)]
         [dummy])))))

(defn filter-blocks
  [repo ref-blocks filters group-by-page?]
  (let [ref-pages (->> (if group-by-page?
                         (mapcat last ref-blocks)
                         ref-blocks)
                       (mapcat (fn [b] (concat (:block/refs b) (:block/children-refs b))))
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
                                   (let [ids (set (concat (map :db/id (:block/refs block))
                                                          (map :db/id (:block/children-refs block))))]
                                     (seq (set/intersection exclude-ids ids)))))

                         (seq include-ids)
                         (remove (fn [block]
                                   (let [ids (set (concat (map :db/id (:block/refs block))
                                                          (map :db/id (:block/children-refs block))))]
                                     (empty? (set/intersection include-ids ids)))))
                         ))]
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
