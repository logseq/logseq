(ns frontend.inference-worker.inference-worker
  "Worker used for text embedding and vector-db"
  (:require ["@huggingface/transformers" :refer [AutoTokenizer]]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]))

(defn init
  []
  (glogi-console/install!)
  (log/info :init 1))
