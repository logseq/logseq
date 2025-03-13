(ns frontend.inference-worker.text-embedding
  "text embedding fns"
  (:require ["@huggingface/transformers" :refer [pipeline]]
            ["hnswlib-wasm" :refer [loadHnswlib]]
            [frontend.inference-worker.state :as infer-worker.state]
            [lambdaisland.glogi :as log]
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

(defn- ensure-hnsw-index!
  [repo]
  (or (@infer-worker.state/*hnsw-index repo)
      (let [hnsw-ctor (.-HierarchicalNSW ^js @infer-worker.state/*hnswlib)
            hnsw (new hnsw-ctor "l2" num-dimensions repo)
            file-exists? (.checkFileExists (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) repo)]
        (if file-exists?
          (.readIndex hnsw repo init-max-elems)
          (.initIndex hnsw init-max-elems 16 200 100))
        (.setEfSearch hnsw 32)
        (swap! infer-worker.state/*hnsw-index assoc repo hnsw)
        (@infer-worker.state/*hnsw-index repo))))

(defn <text-embedding
  [text-coll]
  (p/let [text-coll (if (array? text-coll) text-coll (into-array text-coll))
          ^js r (._call ^js @infer-worker.state/*extractor text-coll embedding-opts)]
    {:data (.-data r)
     :type (.-type r)
     :dims (.-dims r)
     :size (.-size r)}))

(defn <text-embedding&store!
  "return labels"
  [repo text-coll delete-labels]
  (p/let [{:keys [data _type dims _size]} (<text-embedding text-coll)
          data-coll (split-into-chunks data (last dims))
          _ (assert (= (count text-coll) (count data-coll)))
          ^js hnsw (ensure-hnsw-index! repo)]
    (when (seq delete-labels) (.markDeleteItems hnsw (into-array delete-labels)))
    (.addItems hnsw data-coll true)))

(defn- search-knn
  [repo query-point num-neighbors]
  (let [^js hnsw (ensure-hnsw-index! repo)]
    (.searchKnn hnsw query-point num-neighbors nil)))

(defn <search-knn
  "return labels"
  [repo query-string num-neighbors]
  (p/let [query-embedding (<text-embedding [query-string])
          query-point (:data query-embedding)]
    (search-knn repo query-point num-neighbors)))

(defn <init
  []
  (p/do!
   (p/let [hnswlib (loadHnswlib)]
     (reset! infer-worker.state/*hnswlib hnswlib)
     (.setDebugLogs (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) true)
     (log/info :loaded :hnswlib))
   (p/let [extractor (pipeline "feature-extraction" "Xenova/all-MiniLM-L6-v2" #js{"device" "webgpu"})]
     (reset! infer-worker.state/*extractor extractor)
     (log/info :loaded :extractor))))
