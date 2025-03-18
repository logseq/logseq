(ns frontend.inference-worker.inference-worker
  "Worker used for text embedding and vector-db"
  (:require ["comlink" :as Comlink]
            [frontend.inference-worker.state :as infer-worker.state]
            [frontend.inference-worker.text-embedding :as infer-worker.text-embedding]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [promesa.core :as p]
            [shadow.cljs.modern :refer [defclass]]))

#_{:clj-kondo/ignore [:unresolved-symbol]}
(defclass InferenceWorker
  (extends js/Object)
  (constructor
   [this]
   (super))

  Object
  (init
   [_this]
   (infer-worker.text-embedding/<init))

  (set-db-worker-proxy
   [_this proxy]
   (reset! infer-worker.state/*db-worker proxy)
   (log/info :set-db-worker-proxy :done))

  (text-embedding
   [_this text-coll]
   (p/chain
    (infer-worker.text-embedding/<text-embedding text-coll)
    clj->js))

  (text-embedding+store!
   ;; return labels(js array)
   [_this repo text-array delete-labels replace-deleted?]
   (p/chain
    (js/Promise. (infer-worker.text-embedding/task--text-embedding&store! repo text-array delete-labels replace-deleted?))
    clj->js))

  (delete-labels
   [_this repo labels]
   (infer-worker.text-embedding/delete-items repo labels))

  (force-reset-index!
   [_this repo]
   (js/Promise. (infer-worker.text-embedding/task--force-reset-index! repo)))

  (write-index!
   [_this repo]
   (js/Promise. (infer-worker.text-embedding/task--write-index! repo)))

  (search
   [_this repo query-string nums-neighbors]
    (infer-worker.text-embedding/<search-knn repo query-string nums-neighbors))

  (index-info
   [_this repo]
   (clj->js (infer-worker.text-embedding/index-info repo))))

(defn init
  []
  (glogi-console/install!)
  (let [^js obj #_{:clj-kondo/ignore [:unresolved-symbol]} (InferenceWorker.)]
    (Comlink/expose obj)))
