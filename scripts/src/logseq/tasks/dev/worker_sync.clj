(ns logseq.tasks.dev.worker-sync
  "Tasks for worker-sync dev processes"
  (:require [babashka.process :refer [process]]))

(def processes
  [{:name "worker-sync-watch"
    :dir "deps/worker-sync"
    :cmd "clojure -M:cljs watch worker-sync"}
   {:name "wrangler-dev"
    :dir "deps/worker-sync/worker"
    :cmd "wrangler dev"}
   {:name "yarn-watch"
    :dir "."
    :cmd "ENABLE_WORKER_SYNC_LOCAL=true yarn watch"}])

(defn start
  []
  (println "Starting worker-sync processes in foreground.")
  (println "Use Ctrl-C to stop.")
  (let [procs (mapv (fn [{:keys [name dir cmd]}]
                      (println "Running:" name "-" cmd)
                      (process ["bash" "-lc" cmd] {:dir dir :inherit true}))
                    processes)]
    (doseq [proc procs]
      @proc)))
