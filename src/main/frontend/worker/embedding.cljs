(ns frontend.worker.embedding
  "Fns about text-embedding, add/delete/search items in hnsw"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [missionary.core :as m]))

;;; TODOs:
;;; - [x] add :logseq.property/description into text-to-embedding
;;; - [x] add tags to text-to-embedding
;;; - [x] check webgpu available, transformers.js is slow without webgpu(the difference is ~70 times)
;;; - [x] expose index-state to ui

(def ^:private empty-vector-search-state
  {:repo->index-info {} ;; repo->index-info
   :repo->canceler {}   ;; repo->canceler
   })

(def ^:private vector-search-state-keys (set (keys empty-vector-search-state)))

(def ^:private *vector-search-state (atom empty-vector-search-state
                                          :validator
                                          (fn [v] (= vector-search-state-keys (set (keys v))))))

(defn- reset-*vector-search-state!
  [repo & {:keys [index-info canceler]}]
  (reset! *vector-search-state
          (cond-> @*vector-search-state
            index-info (assoc :repo->index-info {repo index-info})
            canceler   (assoc-in [:repo->canceler repo] canceler)))
  nil)

(defn cancel-indexing
  [repo]
  (when-let [canceler (get-in @*vector-search-state [:repo->canceler repo])]
    (canceler)
    (swap! *vector-search-state assoc-in [:repo->canceler repo] nil)
    (swap! *vector-search-state assoc-in [:repo->index-info repo :indexing?] false)
    nil))

(defn- indexing?
  [repo]
  (get-in @*vector-search-state [:repo->index-info repo :indexing?]))

(defn- hidden-entity?
  [entity]
  (or (ldb/hidden? entity)
      (let [page (:block/page entity)]
        (and (ldb/hidden? page)
             (not= (:block/title page) common-config/quick-add-page-name)))))

(defn- stale-block-filter-preds
  "When `reset?`, ignore :logseq.property.embedding/hnsw-label-updated-at in block"
  [reset?]
  (let [preds (cond->> (list (fn [b]
                               (let [db-ident (:db/ident b)
                                     title (:block/title b)]
                                 (and (or (nil? db-ident)
                                          (not (string/starts-with? (namespace db-ident) "logseq.")))
                                      (not (string/blank? title))
                                      (not (hidden-entity? b))
                                      (nil? (:logseq.property/view-for b))
                                      (not (keyword-identical?
                                            :logseq.property/description
                                            (:db/ident (:logseq.property/created-from-property b))))))))

                (not reset?)
                (cons (fn [b]
                        (let [block-updated-at (:block/updated-at b)
                              hnsw-label-updated-at (:logseq.property.embedding/hnsw-label-updated-at b)]
                          (or (nil? hnsw-label-updated-at)
                              (> block-updated-at hnsw-label-updated-at))))))]
    (apply every-pred preds)))

(defn- stale-block-lazy-seq
  [db reset?]
  (let [datoms (if reset?
                 (rseq (d/index-range db :block/updated-at nil nil))
                 (d/datoms db :avet :logseq.property.embedding/hnsw-label-updated-at 0))]
    (->> datoms
         (sequence
          (comp (map #(d/entity db (:e %)))
                (filter (stale-block-filter-preds reset?))
                (map (fn [b]
                       (assoc b :block.temp/text-to-embedding
                              (db-content/recur-replace-uuid-in-block-title b)
                            ;; FIXME: tags and properties can affect sorting
                            ;; (str (db-content/recur-replace-uuid-in-block-title b)
                            ;;      (let [tags (->> (:block/tags b)
                            ;;                      (map :block/title))]
                            ;;        (when (seq tags)
                            ;;          (str " " (string/join ", " (map (fn [t] (str "#" t)) tags)))))
                            ;;      (when-let [desc (:block/title (:logseq.property/description b))]
                            ;;        (str "\nDescription: " desc)))
                              ))))))))
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
  [db e+updated-at-coll]
  (let [es (map first e+updated-at-coll)
        exist-es (set (keep
                       (fn [b] (when (:block/uuid b) (:db/id b)))
                       (d/pull-many db [:block/uuid :db/id] es)))]
    (keep
     (fn [[e updated-at]]
       (when (contains? exist-es e)
         [:db/add e :logseq.property.embedding/hnsw-label-updated-at updated-at]))
     e+updated-at-coll)))

(defn- task--update-index-info!*
  ([repo ^js infer-worker]
   (m/sp
     (reset-*vector-search-state! repo :index-info
                                  (merge (:index-info @*vector-search-state)
                                         (js->clj (c.m/<? (.index-info infer-worker repo))
                                                  :keywordize-keys true)))))
  ([repo ^js infer-worker indexing?*]
   (m/sp
     (reset-*vector-search-state! repo :index-info
                                  (assoc (js->clj (c.m/<? (.index-info infer-worker repo))
                                                  :keywordize-keys true)
                                         :indexing? indexing?*)))))

(defn task--update-index-info!
  [repo]
  (m/sp
    (when-let [^js infer-worker @worker-state/*infer-worker]
      (m/? (task--update-index-info!* repo infer-worker)))))

(defn- get-partition-size
  [_repo]
  500
  ;; (let [conn (worker-state/get-datascript-conn repo)
  ;;       embedding-model-name (ldb/get-key-value @conn :logseq.kv/graph-text-embedding-model-name)]
  ;;   (case embedding-model-name
  ;;     "onnx-community/Qwen3-Embedding-0.6B-ONNX"
  ;;     100
  ;;     500))
  )

(defn- task--embedding-stale-blocks!
  "embedding outdated block-data
  outdate rule: block/updated-at > :logseq.property.embedding/hnsw-label-updated-at"
  [repo reset-embedding?]
  (m/sp
    (when-let [^js infer-worker @worker-state/*infer-worker]
      (when-let [conn (worker-state/get-datascript-conn repo)]
        (let [stale-blocks (stale-block-lazy-seq @conn false)]
          (when (seq stale-blocks)
            (m/? (task--update-index-info!* repo infer-worker true))
            (when reset-embedding?
              (c.m/<? (.force-reset-index! infer-worker repo)))
            (doseq [stale-block-chunk (sequence (partition-by-text-size (get-partition-size repo)) stale-blocks)]
              (let [e+updated-at-coll (map (juxt :db/id :block/updated-at) stale-block-chunk)
                    _ (when (some (fn [id] (> id 2147483647)) (map :db/id stale-block-chunk))
                        (throw (ex-info "Wrong db/id" {:data (filter (fn [item] (> (:db/id item) 2147483647)) stale-block-chunk)})))
                    _ (c.m/<?
                       (.text-embedding+store!
                        infer-worker
                        repo
                        (into-array (map :block.temp/text-to-embedding stale-block-chunk))
                        (into-array (map :db/id stale-block-chunk))
                        false))
                    tx-data (labels-update-tx-data @conn e+updated-at-coll)]
                (d/transact! conn tx-data {:skip-refresh? true})
                (m/? (task--update-index-info!* repo infer-worker true))
                (c.m/<? (.write-index! infer-worker repo))))
            (m/? (task--update-index-info!* repo infer-worker false))))))))

(defn- embedding-stale-blocks!
  [repo reset-embedding?]
  (when-not (indexing? repo)
    (let [canceler (c.m/run-task
                     :embedding-stale-blocks!
                     (task--embedding-stale-blocks! repo reset-embedding?)
                     :succ (constantly nil))]
      (reset-*vector-search-state! repo :canceler canceler))))

(defn embedding-graph!
  [repo {:keys [reset-embedding?]
         :or {reset-embedding? false}}]
  (when-not (indexing? repo)
    (when-let [conn (worker-state/get-datascript-conn repo)]
      (when (ldb/get-key-value @conn :logseq.kv/graph-text-embedding-model-name)
        (when (or reset-embedding?
                  ;; embedding not exists yet
                  (empty? (d/datoms @conn :avet :logseq.property.embedding/hnsw-label-updated-at)))
          ;; reset embedding
          (let [mark-embedding-tx-data (->>
                                        (d/datoms @conn :avet :block/title)
                                        (map (fn [d]
                                               [:db/add (:e d) :logseq.property.embedding/hnsw-label-updated-at 0])))]
            (d/transact! conn mark-embedding-tx-data {:skip-refresh? true})))

        (embedding-stale-blocks! repo reset-embedding?)))))

(defn task--embedding-model-info
  [repo]
  (m/sp
    (when-let [^js infer-worker @worker-state/*infer-worker]
      (let [available-model-names (c.m/<? (.available-embedding-models infer-worker))
            conn (worker-state/get-datascript-conn repo)
            embedding-model-name (ldb/get-key-value @conn :logseq.kv/graph-text-embedding-model-name)]
        {:available-model-names available-model-names
         :graph-text-embedding-model-name embedding-model-name}))))

(defn task--init-embedding-model
  [repo]
  (m/sp
    (when-let [^js infer-worker @worker-state/*infer-worker]
      (let [conn (worker-state/get-datascript-conn repo)]
        (if-let [embedding-model-name (ldb/get-key-value @conn :logseq.kv/graph-text-embedding-model-name)]
          (c.m/<? (.load-model infer-worker embedding-model-name))
          (log/info :init-load-model "model-name has not been set yet, skip"))))))

(defn task--load-model
  [repo model-name]
  (m/sp
    (when-let [^js infer-worker @worker-state/*infer-worker]
      (let [conn (worker-state/get-datascript-conn repo)]
        (when (c.m/<? (.load-model infer-worker model-name))
          (d/transact! conn [(ldb/kv :logseq.kv/graph-text-embedding-model-name model-name)])
          (log/info :loaded-model model-name))))))

(defn task--search
  [repo query-string nums-neighbors]
  (m/sp
    (when-not (indexing? repo)
      (when-let [^js infer-worker @worker-state/*infer-worker]
        (when-let [conn (worker-state/get-datascript-conn repo)]
          (let [{:keys [distances neighbors]}
                (worker-util/profile (str "search: '" query-string "'")
                                     (js->clj (c.m/<? (.search infer-worker repo query-string nums-neighbors)) :keywordize-keys true))]
            (->> (map vector distances neighbors)
                 (keep (fn [[distance label]]
                         ;; (prn :debug :semantic-search-result
                         ;;      :block (:block/title (d/entity @conn label))
                         ;;      :distance distance)
                         (when-not (or (js/isNaN distance) (>= distance 0.6)
                                       (> label 2147483647))
                           (when-let [block (d/entity @conn label)]
                             (when (:block/title block)
                               {:block block
                                :distance distance}))))))))))))

(def ^:private vector-search-state-flow
  (m/eduction
   (map (fn [m] (dissoc m :repo->canceler)))
   (c.m/throttle 300 (m/watch *vector-search-state))))

(when-not common-config/PUBLISHING ; NOTE: we may support vector-search in publishing mode later
  (c.m/run-background-task
   ::subscribe-state
   (m/reduce
    (fn [_ m] (worker-util/post-message :vector-search-sync-state m))
    vector-search-state-flow)))

(comment
  (def repo (frontend.worker.state/get-current-repo))
  (def conn (frontend.worker.state/get-datascript-conn (frontend.worker.state/get-current-repo)))
  (.force-reset-index! @worker-state/*infer-worker repo)
  ((task--embedding-stale-blocks! repo) prn js/console.log)
  ((task--re-embedding-graph-data! repo) prn js/console.log)

  ((task--search repo "perf performance datomic stat" 10) prn js/console.log))
