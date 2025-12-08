(ns frontend.inference-worker.text-embedding
  "text embedding fns"
  (:require ["@huggingface/transformers" :refer [pipeline]]
            ["hnswlib-wasm" :refer [loadHnswlib]]
            [clojure.data :as data]
            [frontend.common.missionary :as c.m]
            [frontend.inference-worker.state :as infer-worker.state]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [missionary.core :as m]
            [promesa.core :as p]))

(add-watch infer-worker.state/*hnsw-index :delete-obj-when-dissoc
           (fn [_ _ o n]
             (let [[old-only] (data/diff o n)]
               (doseq [[repo ^js hnsw-index] old-only]
                 (when hnsw-index
                   (log/info :delete-hnsw-index repo)
                   (.delete hnsw-index))))))

(defonce *port (atom nil))

(def ^:private embedding-opts #js{"pooling" "mean" "normalize" true})

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

(defn- init-index!
  [^js hnsw]
  (.initIndex hnsw init-max-elems 16 200 100)
  (.setEfSearch hnsw 32))

(defn- ^js get-hnsw-index
  [repo]
  (or (@infer-worker.state/*hnsw-index repo)
      (let [hnsw-ctor (.-HierarchicalNSW ^js @infer-worker.state/*hnswlib)
            hnsw (new hnsw-ctor "cosine" (or (:dims (:hnsw-config (second @infer-worker.state/*model-name+config))) 384) "")
            file-exists? (.checkFileExists (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) repo)]
        (when file-exists?
          (.readIndex hnsw repo init-max-elems)
          (swap! infer-worker.state/*hnsw-index assoc repo hnsw)
          hnsw))))

(defn- ^js new-hnsw-index!
  [repo]
  (when (get-hnsw-index repo)
    (swap! infer-worker.state/*hnsw-index dissoc repo))
  (let [hnsw-ctor (.-HierarchicalNSW ^js @infer-worker.state/*hnswlib)
        hnsw (new hnsw-ctor "cosine" (or (:dims (:hnsw-config (second @infer-worker.state/*model-name+config))) 384) "")]
    (init-index! hnsw)
    (swap! infer-worker.state/*hnsw-index assoc repo hnsw)
    hnsw))

(defn- model-loaded?
  []
  (and @infer-worker.state/*extractor
       @infer-worker.state/*model-name+config))

(defn <text-embedding
  [text-array]
  (assert (and (array? text-array) (every? string? text-array)))
  (p/let [^js r (._call ^js @infer-worker.state/*extractor text-array embedding-opts)]
    {:data (.-data r)
     :type (.-type r)
     :dims (.-dims r)
     :size (.-size r)}))

(defn- add-items
  [^js hnsw data-coll labels replace-deleted?]
  (let [max-elems (.getMaxElements hnsw)
        current-count (.getCurrentCount hnsw)
        add-count (count data-coll)]
    (when (>= (+ add-count current-count) max-elems)
      (let [new-size (+ current-count (max (* 2 add-count) current-count))]
        (log/info :hnsw-resize {:from current-count :to new-size})
        (.resizeIndex hnsw new-size)))
    ;; (.addItems hnsw data-coll labels replace-deleted?)
    (dorun
     (mapcat
      (fn [embedding label]
        (assert (and embedding label) {:embedding embedding
                                       :label label})
        (.addPoint hnsw embedding label replace-deleted?))
      data-coll
      labels))))

(defn delete-items
  [repo labels]
  (when-let [hnsw (get-hnsw-index repo)]
    (.markDeleteItems hnsw (into-array labels))))

(defn task--text-embedding&store!
  "return labels(js-array)"
  [repo text-array labels replace-deleted?]
  (m/sp
    (when (model-loaded?)
      (let [hnsw (or (get-hnsw-index repo) (new-hnsw-index! repo))
            {:keys [data _type dims _size]} (worker-util/profile :<text-embedding
                                                                 (c.m/<? (<text-embedding text-array)))
            data-coll (split-into-chunks data (last dims))
            _ (assert (= (count text-array) (count data-coll)))]
        (worker-util/profile (keyword "add-items" (str (alength data-coll)))
                             (add-items hnsw data-coll labels replace-deleted?))))))

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
    (when-let [hnsw (new-hnsw-index! repo)]
      (when-not (zero? (.getCurrentCount hnsw))
        (init-index! hnsw)
        (m/? (task--write-index!* repo hnsw))))))

(defn task--write-index!
  [repo]
  (m/sp
    (when-let [hnsw (get-hnsw-index repo)]
      (m/? (task--write-index!* repo hnsw)))))

(defn- search-knn
  [repo query-point num-neighbors]
  (when-let [hnsw (get-hnsw-index repo)]
    (.searchKnn hnsw query-point num-neighbors nil)))

(defn <search-knn
  "return labels"
  [repo query-string num-neighbors]
  (when (model-loaded?)
    (p/let [query-embedding (<text-embedding #js[query-string])
            query-point (:data query-embedding)]
      (search-knn repo query-point num-neighbors))))

(defn index-info
  [repo]
  (when-let [hnsw (get-hnsw-index repo)]
    {:current-count (.getCurrentCount hnsw)
     :max-elements (.getMaxElements hnsw)
     :ef-search (.getEfSearch hnsw)
     :num-dims (.getNumDimensions hnsw)}))

(def available-embedding-models
  {"Xenova/all-MiniLM-L6-v2" {:tf-config {:dtype "fp32"}
                              :hnsw-config {:dims 384}}
   ;; "onnx-community/Qwen3-Embedding-0.6B-ONNX" {:tf-config {:dtype "fp16"}
   ;;                                             :hnsw-config {:dims 1024}}
   })

(defonce ^:private *load-model-progress (atom nil))

(defn <load-model
  [model-name]
  (if (= model-name (first @infer-worker.state/*model-name+config))
    true
    (when-let [config (get available-embedding-models model-name)]
      (p/let [extractor (pipeline "feature-extraction" model-name
                                  (clj->js
                                   (-> (:tf-config config)
                                       (assoc "device" "webgpu")
                                       (assoc "progress_callback" #(reset! *load-model-progress %)))))]
        (reset! infer-worker.state/*extractor extractor)
        (reset! infer-worker.state/*model-name+config [model-name config])
        true))))

(defn <init
  [model-name]
  (p/let [hnswlib (loadHnswlib)]
    (reset! infer-worker.state/*hnswlib hnswlib)
    (.setDebugLogs (.-EmscriptenFileSystemManager ^js @infer-worker.state/*hnswlib) true)
    (log/info :loaded :hnswlib)
    (when model-name
      (<load-model model-name))))

(when-not common-config/PUBLISHING
  (c.m/run-background-task
   ::push-load-model-progress
   (m/reduce
    (fn [_ v]
      (when-let [port @*port]
        (worker-util/post-message :vector-search/load-model-progress v {:port port})))
    (c.m/throttle 500 (m/watch *load-model-progress)))))

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
