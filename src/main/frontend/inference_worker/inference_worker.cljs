(ns frontend.inference-worker.inference-worker
  "Worker used for text embedding and vector-db"
  (:require ["comlink" :as Comlink]
            [frontend.inference-worker.text-embedding :as infer-worker.text-embedding]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [shadow.cljs.modern :refer [defclass]]))

#_:clj-kondo/ignore
(defclass InferenceWorker
  (extends js/Object)
  (constructor
   [this]
   (super))

  Object
  (init
   [_this]
   (infer-worker.text-embedding/<init))

  (text-embedding
   [_this text-coll]
   (p/let [output (infer-worker.text-embedding/<text-embedding text-coll)]
     (ldb/write-transit-str output)))

  (text-embedding+store!
   [_this repo text-coll delete-labels]
   (p/let [labels (infer-worker.text-embedding/<text-embedding&store! repo text-coll delete-labels)]
     (ldb/write-transit-str labels)))

  (search
   [_this repo query-string nums-neighbors]
    (infer-worker.text-embedding/<search-knn repo query-string nums-neighbors)))

(defn init
  []
  (glogi-console/install!)
  (let [^js obj #_{:clj-kondo/ignore [:unresolved-symbol]} (InferenceWorker.)]
    (Comlink/expose obj)))
