(ns frontend.worker.handler.search
  "Full-text and vector search operations for the db worker."
  (:require
   [cljs-bean.core :as bean]
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.platform :as platform]
   [frontend.worker.search :as search]
   [frontend.worker.state :as worker-state]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [promesa.core :as p]))

(def search-db-version
  "Current search index version, stored in PRAGMA user_version.
  Bump to force a rebuild when the index format changes."
  2)

(def ^:private search-index-build-batch-size 200)
(def ^:private vector-embedding-batch-size 32)
(def ^:private vector-embedding-parallelism 2)
(def ^:private vector-embedding-max-batch-chars (* vector-embedding-batch-size 2048))
(def ^:private vector-embedding-max-title-length 2048)
(def ^:private query-embedding-timeout-ms 50)
(def ^:private search-index-build-time-budget-ms 8)
(def ^:private search-index-build-idle-status-ttl-ms 2000)
(def ^:private search-index-build-pause-ms 300)
(defonce ^:private *search-index-build-ids (atom {}))
(defonce ^:private *vector-index-rebuild-ids (atom {}))

(defn- node-runtime?
  []
  (= :node (platform/env-flag (platform/current) :runtime)))

(defn clear-search-index-builds!
  [repo]
  (swap! *search-index-build-ids dissoc repo)
  (swap! *vector-index-rebuild-ids dissoc repo))

(defn- get-search-db
  [repo]
  (worker-state/get-sqlite-conn repo :search))

(defn- search-index-version
  [^js search-db]
  (aget (aget (.exec search-db #js {:sql "PRAGMA user_version" :rowMode "array"}) 0) 0))

(defn- expected-vector-index-metadata
  []
  {:embedding-model-id (platform/embedding-model-id (platform/current))
   :embedding-dimension (platform/embedding-dimension (platform/current))
   :context-version search/vector-context-version})

(defn- persist-vector-index-metadata!
  [repo]
  (when-let [set-metadata! (:set-metadata! (worker-state/get-vector-index repo))]
    (set-metadata! (expected-vector-index-metadata))))

(declare <embed-index-batches vector-embedding-batches)

(defn- start-vector-index-rebuild!
  [repo build-id]
  (swap! *vector-index-rebuild-ids assoc repo build-id))

(defn- active-vector-index-rebuild?
  [repo build-id]
  (= build-id (get @*vector-index-rebuild-ids repo)))

(defn- clear-vector-index-rebuild!
  [repo build-id]
  (swap! *vector-index-rebuild-ids
         (fn [builds]
           (if (= build-id (get builds repo))
             (dissoc builds repo)
             builds))))

(defn- schedule-vector-index-rebuild!
  [repo build-id indexed-blocks]
  (when (worker-state/get-vector-index repo)
    (start-vector-index-rebuild! repo build-id)
    (let [indexed-blocks (vec indexed-blocks)]
      (-> (if (seq indexed-blocks)
            (p/let [vector-blocks (<embed-index-batches (vector-embedding-batches indexed-blocks))]
              (when (active-vector-index-rebuild? repo build-id)
                (when-let [vector-index (worker-state/get-vector-index repo)]
                  (search/upsert-vector-blocks! vector-index vector-blocks))))
            (p/resolved nil))
          (p/then (fn [_]
                    (when (active-vector-index-rebuild? repo build-id)
                      (persist-vector-index-metadata! repo))))
          (p/catch (fn [error]
                     (when (active-vector-index-rebuild? repo build-id)
                       (log/error :search/vector-index-rebuild-failed {:repo repo
                                                                       :error error}))))
          (p/finally (fn []
                       (clear-vector-index-rebuild! repo build-id))))))
  nil)

(defn- start-search-index-build!
  [repo]
  (let [build-id (str (random-uuid))]
    (swap! *search-index-build-ids assoc repo build-id)
    build-id))

(defn- clear-search-index-build!
  [repo build-id]
  (swap! *search-index-build-ids
         (fn [builds]
           (if (= build-id (get builds repo))
             (dissoc builds repo)
             builds))))

(defn- ensure-active-search-index-build!
  [repo build-id]
  (when-not (= build-id (get @*search-index-build-ids repo))
    (throw (ex-info "stale search index build"
                    {:type :search/stale-index-build
                     :repo repo
                     :build-id build-id}))))

(defn- report-search-index-progress!
  [repo payload]
  (if (node-runtime?)
    (do
      (platform/post-message! (platform/current)
                              :thread-api/search-index-build-progress
                              [repo payload])
      (p/resolved nil))
    (-> (worker-state/<invoke-main-thread :thread-api/search-index-build-progress repo payload)
        (p/catch (fn [_error] nil)))))

(defn search-blocks
  [repo q option]
  (let [search-db (get-search-db repo)
        conn (worker-state/get-datascript-conn repo)
        vector-index (worker-state/get-vector-index repo)]
    (search/search-blocks conn search-db vector-index q option)))

(defn- validate-embedding-count!
  [blocks embeddings]
  (when-not (= (count blocks) (count embeddings))
    (throw (ex-info "embedding result count mismatch"
                    {:block-count (count blocks)
                     :embedding-count (count embeddings)
                     :model-id (platform/embedding-model-id (platform/current))}))))

(defn- embeddable-index-block?
  [{:keys [id page title]}]
  (and id page (not (string/blank? (str title)))))

(defn- vector-embedding-title
  [block-or-title]
  (let [title (if (map? block-or-title)
                (or (:vector-title block-or-title)
                    (:title block-or-title))
                block-or-title)
        title (str title)]
    (if (> (count title) vector-embedding-max-title-length)
      (subs title 0 vector-embedding-max-title-length)
      title)))

(defn- vector-embedding-batches
  [blocks]
  (loop [remaining (seq blocks)
         batch []
         batch-chars 0
         result []]
    (if-let [block (first remaining)]
      (let [text (vector-embedding-title block)
            text-chars (count text)
            full? (or (>= (count batch) vector-embedding-batch-size)
                      (and (seq batch)
                           (> (+ batch-chars text-chars)
                              vector-embedding-max-batch-chars)))]
        (if full?
          (recur remaining [] 0 (conj result batch))
          (recur (next remaining)
                 (conj batch block)
                 (+ batch-chars text-chars)
                 result)))
      (cond-> result
        (seq batch) (conj batch)))))

(defn- <embed-index-batch
  ([batch]
   (<embed-index-batch #(platform/embed-texts (platform/current) %) batch))
  ([embed-texts-fn batch]
   (p/let [embeddings (embed-texts-fn (mapv vector-embedding-title batch))
           _ (validate-embedding-count! batch embeddings)]
     (mapv (fn [block embedding]
             (assoc block :embedding embedding))
           batch
           embeddings))))

(defn- <embed-index-batch-with-fallback
  ([batch]
   (<embed-index-batch-with-fallback #(platform/embed-texts (platform/current) %) batch))
  ([embed-texts-fn batch]
   (-> (<embed-index-batch embed-texts-fn batch)
       (p/catch
        (fn [error]
          (if (= 1 (count batch))
            (throw error)
            (let [split-index (quot (count batch) 2)
                  left (subvec (vec batch) 0 split-index)
                  right (subvec (vec batch) split-index)]
              (p/let [left-embedded (<embed-index-batch-with-fallback embed-texts-fn left)
                      right-embedded (<embed-index-batch-with-fallback embed-texts-fn right)]
                (into left-embedded right-embedded)))))))))

(defn- pop-embedding-batch!
  [queue]
  (let [selected (atom nil)]
    (swap! queue
           (fn [items]
             (if (seq items)
               (do
                 (reset! selected (first items))
                 (subvec items 1))
               items)))
    @selected))

(defn- <embed-index-batches
  ([batches]
   (<embed-index-batches batches nil))
  ([batches on-batch-embedded]
   (let [batches (vec batches)]
     (if (empty? batches)
       (p/resolved [])
       (let [queue (atom (mapv vector (range (count batches)) batches))
             results (atom {})
             worker-count (min vector-embedding-parallelism (count batches))]
         (letfn [(worker []
                   (if-let [[idx batch] (pop-embedding-batch! queue)]
                     (-> (<embed-index-batch-with-fallback batch)
                         (p/then (fn [embedded]
                                   (swap! results assoc idx embedded)
                                   (when on-batch-embedded
                                     (on-batch-embedded (count embedded)))
                                   (worker))))
                     (p/resolved nil)))]
           (p/let [_ (p/all (mapv (fn [_] (worker)) (range worker-count)))]
             (into [] (mapcat (fn [idx]
                                (get @results idx))
                              (range (count batches)))))))))))

(defn- <embed-index-blocks
  [repo blocks]
  (let [blocks (vec (filter embeddable-index-block? blocks))]
    (if (and (seq blocks) (worker-state/get-vector-index repo))
      (<embed-index-batches (vector-embedding-batches blocks))
      (p/resolved []))))

(defn- schedule-vector-index-upsert!
  [repo blocks]
  (when (and (seq blocks) (worker-state/get-vector-index repo))
    (-> (<embed-index-blocks repo blocks)
        (p/then (fn [vector-blocks]
                  (when (seq vector-blocks)
                    (search/upsert-vector-blocks! (worker-state/get-vector-index repo) vector-blocks))))
        (p/catch (fn [error]
                   (log/error :search/vector-index-upsert-failed {:repo repo
                                                                  :error error})))))
  nil)

(defn- <search-blocks
  [repo q option]
  (let [vector-index (worker-state/get-vector-index repo)]
    (if (and vector-index
             (:feature/enable-semantic-search? option)
             (not (:page-only? option))
             (not (:query-embedding option))
             (not (string/blank? q)))
      (-> (p/let [embeddings (-> (platform/embed-texts (platform/current) [q])
                                  (p/timeout query-embedding-timeout-ms))
                  _ (validate-embedding-count! [{:title q}] embeddings)]
            (search-blocks repo q (assoc option :query-embedding (first embeddings))))
          (p/catch (fn [error]
                     (log/warn :search/query-embedding-failed {:repo repo
                                                               :error error})
                     (search-blocks repo q option))))
      (p/resolved (search-blocks repo q option)))))

(def-thread-api :thread-api/search-blocks
  [repo q option]
  (<search-blocks repo q option))

(def-thread-api :thread-api/search-upsert-blocks
  [repo blocks]
  (when-let [db (get-search-db repo)]
    (search/upsert-blocks! db (bean/->js blocks))
    (schedule-vector-index-upsert! repo blocks)
    nil))

(def-thread-api :thread-api/search-delete-blocks
  [repo ids]
  (when-let [db (get-search-db repo)]
    (search/delete-vector-blocks! (worker-state/get-vector-index repo) ids)
    (search/delete-blocks! db ids)
    nil))

(def-thread-api :thread-api/search-truncate-tables
  [repo]
  (when-let [db (get-search-db repo)]
    (search/truncate-vector-index! (worker-state/get-vector-index repo))
    (search/truncate-table! db)
    nil))

(def-thread-api :thread-api/search-build-blocks-indice
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (search/build-blocks-indice @conn)))

(defn- take-search-index-batch
  [items batch-size time-budget-ms]
  (let [deadline (+ (common-util/time-ms) time-budget-ms)]
    (loop [batch (transient [])
           remaining (seq items)
           n 0]
      (if (or (nil? remaining)
              (>= n batch-size)
              (and (pos? n) (>= (common-util/time-ms) deadline)))
        [(persistent! batch) remaining]
        (recur (conj! batch (first remaining))
               (next remaining)
               (inc n))))))

(defn- search-index-input-idle?
  [repo]
  (if (node-runtime?)
    true
    (let [status-map @(:thread-atom/search-input-idle-status @worker-state/*state)
          {:keys [idle? ts]} (get status-map repo)
          fresh? (and (number? ts)
                      (<= (- (common-util/time-ms) ts)
                          search-index-build-idle-status-ttl-ms))]
      (if (and fresh? (boolean? idle?))
        idle?
        true))))

(defn- <wait-for-search-index-idle!
  [repo build-id]
  (p/loop []
    (ensure-active-search-index-build! repo build-id)
    (if (search-index-input-idle? repo)
      nil
      (p/let [_ (js/Promise. (fn [resolve] (js/setTimeout resolve search-index-build-pause-ms)))]
        (p/recur)))))

(defn- <build-blocks-index!
  "Build FTS/vector index in batches with yielding. Sets user_version to search-db-version on completion."
  [repo search-db conn build-id]
  (ensure-active-search-index-build! repo build-id)
  (let [db @conn
        blocks (->> (d/datoms db :avet :block/uuid)
                    (keep #(d/entity db (:e %)))
                    (remove search/hidden-entity?)
                    vec)
        total (count blocks)
        vector-index (worker-state/get-vector-index repo)
        index-opts {:include-vector-title? (some? vector-index)}
        progress-for-fts (fn [processed]
                           (if (zero? total)
                             100
                             (min 100 (int (* 100 (/ processed total))))))
        report-progress! (fn [progress processed total]
                           (report-search-index-progress! repo {:build-id build-id
                                                                :status :running
                                                                :stage :search-index
                                                                :progress progress
                                                                :processed processed
                                                                :total total}))]
    (p/do!
     (report-search-index-progress! repo {:build-id build-id
                                          :status :running
                                          :stage :search-index
                                          :progress 0
                                          :processed 0
                                          :total total})
     (<wait-for-search-index-idle! repo build-id)
     (ensure-active-search-index-build! repo build-id)
     (search/truncate-table! search-db)
     (search/truncate-vector-index! vector-index)
     (p/loop [remaining (seq blocks)
              processed 0
              last-progress 0
              indexed-blocks []]
       (ensure-active-search-index-build! repo build-id)
       (if (seq remaining)
         (let [[batch remaining'] (take-search-index-batch remaining
                                                           search-index-build-batch-size
                                                           search-index-build-time-budget-ms)
               processed' (+ processed (count batch))
               indexed (vec (keep #(search/block->index % index-opts) batch))
               indexed-blocks' (into indexed-blocks indexed)
               progress (progress-for-fts processed')
               should-report? (> progress last-progress)]
           (p/let [_ (when (seq indexed)
                       (search/upsert-blocks! search-db (bean/->js indexed)))
                   _ (when should-report?
                       (report-progress! progress processed' total))
                   _ (js/Promise. (fn [resolve] (js/setTimeout resolve 0)))]
             (p/recur remaining' processed' (if should-report? progress last-progress) indexed-blocks')))
         (do
           (ensure-active-search-index-build! repo build-id)
           (schedule-vector-index-rebuild! repo build-id indexed-blocks)
           (p/let [_ (do
                       (.exec search-db (str "PRAGMA user_version = " search-db-version))
                       (report-search-index-progress! repo {:build-id build-id
                                                            :status :completed
                                                            :stage :search-index
                                                            :progress 100
                                                            :processed total
                                                            :total total}))]
             nil)))))))

(def-thread-api :thread-api/search-build-blocks-indice-in-worker
  [repo & [force?]]
  (p/let [search-db (get-search-db repo)]
    (when search-db
      (let [version (search-index-version search-db)]
        (if (and (= version search-db-version)
                 (not force?))
          version
          (when-let [conn (worker-state/get-datascript-conn repo)]
            (let [build-id (start-search-index-build! repo)]
              (-> (report-search-index-progress! repo {:build-id build-id
                                                       :status :running
                                                       :stage :search-index
                                                       :progress 0
                                                       :processed 0
                                                       :total 0})
                  (p/then (fn [_]
                            (js/Promise. (fn [resolve] (js/setTimeout resolve 0)))))
                  (p/then (fn [_]
                            (<build-blocks-index! repo search-db conn build-id)))
                  (p/catch (fn [error]
                             (when-not (= :search/stale-index-build (:type (ex-data error)))
                               (log/error :search/index-build-failed {:repo repo
                                                                      :error error}))))
                  (p/finally (fn []
                               (when (= build-id (get @*search-index-build-ids repo))
                                 (report-search-index-progress! repo {:build-id build-id
                                                                      :status :idle}))
                               (clear-search-index-build! repo build-id))))
              :started)))))))

(def-thread-api :thread-api/search-build-pages-indice
  [_repo]
  nil)
