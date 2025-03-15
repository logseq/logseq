(ns frontend.inference-worker.text-embedding
  "text embedding fns"
  (:require ["@huggingface/transformers" :refer [pipeline]]
            ["hnswlib-wasm" :refer [loadHnswlib]]
            [frontend.common.missionary :as c.m]
            [frontend.inference-worker.state :as infer-worker.state]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [missionary.core :as m]
            [promesa.core :as p]))

(def ^:private embedding-opts #js{"pooling" "mean" "normalize" true})

(def ^:private num-dimensions 384)
(def ^:private init-max-elems 100)

(defn- split-into-chunks
  [js-array chunk-size]
  (let [length (alength js-array)
        result (array)]
    (loop [i 0]
      (when (< i length)
        (.push result (.slice js-array i (+ i chunk-size)))
        (recur (+ i chunk-size))))
    result))

(defn- init-index
  [^js hnsw]
  (.initIndex hnsw init-max-elems 16 200 100)
  (.setEfSearch hnsw 64 ;;default 32
                ))

(defn- ^js ensure-hnsw-index!
  [repo]
  (or (@infer-worker.state/*hnsw-index repo)
      (let [hnsw-ctor (.-HierarchicalNSW ^js @infer-worker.state/*hnswlib)
            hnsw (new hnsw-ctor "cosine" num-dimensions "")
            file-exists? (.checkFileExists (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) repo)]
        (if file-exists?
          (.readIndex hnsw repo init-max-elems)
          (init-index hnsw))
        (swap! infer-worker.state/*hnsw-index assoc repo hnsw)
        (@infer-worker.state/*hnsw-index repo))))

(defn <text-embedding
  [text-array]
  (assert (and (array? text-array) (every? string? text-array)))
  (p/let [^js r (._call ^js @infer-worker.state/*extractor text-array embedding-opts)]
    {:data (.-data r)
     :type (.-type r)
     :dims (.-dims r)
     :size (.-size r)}))

(defn- add-items
  [^js hnsw data-coll replace-deleted?]
  (let [max-elems (.getMaxElements hnsw)
        current-count (.getCurrentCount hnsw)
        add-count (count data-coll)]
    (when (>= (+ add-count current-count) max-elems)
      (let [new-size (+ current-count (max (* 2 add-count) current-count))]
        (log/info :hnsw-resize {:from current-count :to new-size})
        (.resizeIndex hnsw new-size)))
    (.addItems hnsw data-coll replace-deleted?)))

(defn delete-items
  [repo labels]
  (.markDeleteItems ^js (ensure-hnsw-index! repo) (into-array labels)))

(defn task--text-embedding&store!
  "return labels(js-array)"
  [repo text-array delete-labels replace-deleted?]
  (m/sp
    (let [{:keys [data _type dims _size]} (worker-util/profile :<text-embedding
                                            (c.m/<? (<text-embedding text-array)))
          data-coll (split-into-chunks data (last dims))
          _ (assert (= (count text-array) (count data-coll)))
          ^js hnsw (ensure-hnsw-index! repo)]
      (when (seq delete-labels) (.markDeleteItems hnsw (into-array delete-labels)))
      (worker-util/profile (keyword "add-items" (str (alength data-coll)))
        (add-items hnsw data-coll replace-deleted?)))))

(def ^:private write-index-wait-delays-flow
  (m/ap
    (loop [[delay-ms & others]
           ;; 50ms + 100 * 100ms = ~10s
           (cons 50 (repeat 100 100))]
      (if delay-ms
        (m/amb
         (m/? (m/sleep delay-ms))
         (recur others))
        (m/amb :timeout)))))

(defn- task--write-index!*
  "NOTE: writeIndex return nil, but it should be a promise.
  so we loop check fs-synced here, until synced=true"
  [repo ^js hnsw]
  (m/sp
    (.writeIndex hnsw repo)
    (let [^js fs (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib)]
      (m/?
       (m/reduce
        (fn [_ x]
          (if-not (keyword-identical? :timeout x)
            (when (.isSynced fs)
              (reduced true))
            (reduced false)))
        write-index-wait-delays-flow)))))

(defn task--force-reset-index!
  "Remove all data in hnsw-index.
  Return synced? (bool)"
  [repo]
  (m/sp
    (let [hnsw (ensure-hnsw-index! repo)]
      (when-not (zero? (.getCurrentCount hnsw))
        (init-index hnsw)
        (m/? (task--write-index!* repo hnsw))))))

(defn task--write-index!
  [repo]
  (m/sp
    (let [hnsw (ensure-hnsw-index! repo)]
      (m/? (task--write-index!* repo hnsw))
      (.getCurrentCount hnsw))))

(defn- search-knn
  [repo query-point num-neighbors]
  (let [^js hnsw (ensure-hnsw-index! repo)]
    (.searchKnn hnsw query-point num-neighbors nil)))

(defn <search-knn
  "return labels"
  [repo query-string num-neighbors]
  (p/let [query-embedding (<text-embedding #js[query-string])
          query-point (:data query-embedding)]
    (search-knn repo query-point num-neighbors)))

(defn <init
  []
  (p/do!
   (p/let [hnswlib (loadHnswlib)]
     (reset! infer-worker.state/*hnswlib hnswlib)
     (.setDebugLogs (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) true)
     (log/info :loaded :hnswlib))
   (p/let [extractor (pipeline "feature-extraction" "Xenova/all-MiniLM-L6-v2" #js{"device" "webgpu" "dtype" "fp32"})]
     (reset! infer-worker.state/*extractor extractor)
     (log/info :loaded :extractor))))

(comment
  (def repo "repo-1")
  (def hnsw (ensure-hnsw-index! repo))
  (def text-coll-100
    (apply concat (repeatedly
                   10
                   (fn []
                     ["The universe is constantly expanding, revealing new mysteries every day."
                      "She decided to take a walk in the park to clear her mind."
                      "Black holes are among the most fascinating and enigmatic objects in the cosmos."
                      "The cat curled up on the windowsill, basking in the afternoon sun."
                      "Scientists believe dark matter makes up a significant portion of the universe."
                      "He practiced the piano diligently, hoping to master the piece by next week."
                      "The stars twinkled brightly in the clear night sky, each one a distant sun."
                      "They laughed together, sharing stories from their childhood."
                      "The Milky Way is just one of billions of galaxies in the vast universe."
                      "She opened the book and began reading, losing herself in the stor"]))))
  (<text-embedding&store! repo text-coll-100 nil))
