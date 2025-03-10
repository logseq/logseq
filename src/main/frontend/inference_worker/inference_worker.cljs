(ns frontend.inference-worker.inference-worker
  "Worker used for text embedding and vector-db"
  (:require
            [lambdaisland.glogi.console :as glogi-console]
            [lambdaisland.glogi :as log]))



(defn init
  []
  (glogi-console/install!)
  (log/info :init 1))
