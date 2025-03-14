(ns frontend.inference-worker.state
  "State hub for inference-worker")

(defonce *db-worker (atom nil))

(defonce *hnswlib (atom nil))

;;repo -> index
(defonce *hnsw-index (atom {}))

(defonce *extractor (atom nil))
