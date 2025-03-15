(ns frontend.worker.embedding
  "Fns about text-embedding, add/delete/search items in hnsw"
  (:require [cljs.pprint :as pp]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [missionary.core :as m]))

(defn- stale-block-filter-preds
  "When `reset?`, ignore :logseq.property.embedding/hnsw-label-updated-at in block"
  [reset?]
  (let [preds (cond-> [(comp nil? :db/ident)
                       (fn [b]
                         (let [title (:block/title b)]
                           (and (not (string/blank? title))
                                (not (ldb/hidden? title))
                                (nil? (:logseq.property/view-for b))
                                (not (keyword-identical?
                                      :logseq.property/description
                                      (:db/ident (:logseq.property/created-from-property b)))))))]

                (not reset?)
                (conj (fn [b]
                        (let [block-updated-at (:block/updated-at b)
                              hnsw-label-updated-at (:logseq.property.embedding/hnsw-label-updated-at b)]
                          (or (nil? hnsw-label-updated-at)
                              (> block-updated-at hnsw-label-updated-at))))))]
    (apply every-pred preds)))

(defn- stale-block-lazy-seq
  [db reset?]
  (->> (rseq (d/index-range db :block/updated-at nil nil))
       (sequence
        (comp (map #(d/entity db (:e %)))
              (filter (stale-block-filter-preds reset?))
              (map (fn [b]
                     (assoc b :block.temp/text-to-embedding
                            (if-let [desc (:block/title (:logseq.property/description b))]
                              (str (:block/title b) ": " desc)
                              (:block/title b)))))))))

(defn- partition-by-text-size
  [text-size]
  (let [*current-size (volatile! 0)
        *partition-index (volatile! 0)]
    (partition-by
     (fn [block]
       (let [block-text-size (count (:block.temp/text-to-embedding block))]
         (vswap! *current-size + block-text-size)
         (if (>= text-size @*current-size)
           @*partition-index
           (do (vreset! *current-size block-text-size)
               (vswap! *partition-index inc))))))))

(defn- labels-update-tx-data
  [db e+updated-at-coll added-labels]
  (assert (= (count e+updated-at-coll) (count added-labels)))
  (let [es (map first e+updated-at-coll)
        exist-es (set (keep
                       (fn [b] (when (:block/uuid b) (:db/id b)))
                       (d/pull-many db [:block/uuid :db/id] es)))]
    (mapcat
     (fn [[e updated-at] label]
       (when (contains? exist-es e)
         [[:db/add e :logseq.property.embedding/hnsw-label label]
          [:db/add e :logseq.property.embedding/hnsw-label-updated-at updated-at]]))
     e+updated-at-coll added-labels)))

(defn <embedding-stale-blocks!
  "embedding outdated block-data
  outdate rule: block/updated-at > :logseq.property.embedding/hnsw-label-updated-at"
  [repo conn]
  (m/sp
    (let [^js infer-worker @worker-state/*infer-worker]
      (assert (some? infer-worker))
      (let [stale-blocks (stale-block-lazy-seq @conn false)]
        (doseq [stale-block-chunk (sequence (partition-by-text-size 2000) stale-blocks)]
          (let [e+updated-at-coll (map (juxt :db/id :block/updated-at) stale-block-chunk)
                delete-labels (into-array (keep :logseq.property.embedding/hnsw-label stale-block-chunk))
                added-labels (worker-util/profile :text-embedding
                               (c.m/<?
                                (.text-embedding+store!
                                 infer-worker repo (into-array (map :block.temp/text-to-embedding stale-block-chunk))
                                 delete-labels false)))
                tx-data (labels-update-tx-data @conn e+updated-at-coll added-labels)]
            (d/transact! conn tx-data)))
        (c.m/<? (.write-index! infer-worker repo))))))

(defn <re-embedding-graph-data!
  "force re-embedding all block-data in graph"
  [repo conn]
  (m/sp
    (let [^js infer-worker @worker-state/*infer-worker]
      (assert (some? infer-worker))
      (c.m/<? (.force-reset-index! infer-worker repo))
      (let [all-blocks (stale-block-lazy-seq @conn true)]
        (doseq [block-chunk (sequence (partition-by-text-size 2000) all-blocks)]
          (let [e+updated-at-coll (map (juxt :db/id :block/updated-at) block-chunk)
                added-labels (worker-util/profile :text-embedding
                               (c.m/<?
                                (.text-embedding+store!
                                 infer-worker repo (into-array (map :block.temp/text-to-embedding block-chunk))
                                 nil false)))
                tx-data (labels-update-tx-data @conn e+updated-at-coll added-labels)]
            (d/transact! conn tx-data))))
      (c.m/<? (.write-index! infer-worker repo)))))

(defn- remove-outdated-hnsw-label!
  [conn es]
  (when (seq es)
    (d/transact!
     conn (mapcat
           (fn [e]
             [[:db.fn/retractAttribute e :logseq.property.embedding/hnsw-label]
              [:db.fn/retractAttribute e :logseq.property.embedding/hnsw-label-updated-at]])
           es))))

(defn <search
  [repo conn query-string nums-neighbors]
  (m/sp
    (let [^js infer-worker @worker-state/*infer-worker]
      (assert (some? infer-worker))
      (let [{:keys [distances neighbors] :as r}
            (worker-util/profile :search
              (js->clj (c.m/<? (.search infer-worker repo query-string nums-neighbors)) :keywordize-keys true))
            labels (->> (map vector distances neighbors)
                        (keep (fn [[distance label]] (when-not (js/isNaN distance) label))))
            datoms (map (fn [label]
                          (->> label
                               (d/datoms @conn :avet :logseq.property.embedding/hnsw-label)
                               (sort-by :tx >))) labels)
            result-es (keep (comp :e first) datoms)
            es-with-outdated-hnsw-label (map :e (mapcat next datoms))
            blocks (map #(select-keys (d/entity @conn %) [:db/id :block/title]) result-es)]
        (remove-outdated-hnsw-label! conn es-with-outdated-hnsw-label)
        (prn :query-result r)
        (pp/pprint blocks)))))

(comment
  (def repo (frontend.worker.state/get-current-repo))
  (def conn (frontend.worker.state/get-datascript-conn (frontend.worker.state/get-current-repo)))
  (.force-reset-index! @worker-state/*infer-worker repo)
  ((<embedding-stale-blocks! repo conn) prn js/console.log)
  ((<re-embedding-graph-data! repo conn) prn js/console.log)

  ((<search repo conn "note zhiyuan" 10) prn js/console.log))
