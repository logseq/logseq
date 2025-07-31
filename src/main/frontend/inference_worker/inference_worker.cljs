(ns frontend.inference-worker.inference-worker
  "Worker used for text embedding and vector-db"
  (:require ["comlink" :as Comlink]
            [frontend.inference-worker.text-embedding :as infer-worker.text-embedding]
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
   [_this model-name]
   (infer-worker.text-embedding/<init model-name))

  (load-model
   [_this model-name]
   (infer-worker.text-embedding/<load-model model-name))

  (available-embedding-models
   [_]
   (clj->js (keys infer-worker.text-embedding/available-embedding-models)))

  (text-embedding
   [_this text-coll]
   (p/chain
    (infer-worker.text-embedding/<text-embedding text-coll)
    clj->js))

  (text-embedding+store!
   ;; return labels(js array)
   [_this repo text-array labels replace-deleted?]
   (p/chain
    (js/Promise. (infer-worker.text-embedding/task--text-embedding&store! repo text-array labels replace-deleted?))
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
  [])

(.addEventListener js/self "connect"
                   (fn [^js e]
                     (glogi-console/install!)
                     (let [port (first (.-ports e))
                           ^js obj #_{:clj-kondo/ignore [:unresolved-symbol]} (InferenceWorker.)]
                       (reset! infer-worker.text-embedding/*port port)
                       (.start port)
                       (Comlink/expose obj port))))
