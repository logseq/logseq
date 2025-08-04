(ns frontend.inference-worker.state
  "State hub for inference-worker")

(defonce *hnswlib (atom nil))

;;repo -> index
(defonce *hnsw-index (atom {}))

(defonce *extractor (atom nil))
(defonce *model-name+config (atom nil))
