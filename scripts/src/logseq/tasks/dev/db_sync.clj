(ns logseq.tasks.dev.db-sync
  "Tasks for db-sync dev processes"
  (:require [babashka.process :refer [process]]))

(def processes
  [{:name "db-sync-watch"
    :dir "deps/db-sync"
    :cmd "clojure -M:cljs watch db-sync"}
   {:name "wrangler-dev"
    :dir "deps/db-sync/worker"
    :cmd "wrangler dev"}
   {:name "yarn-watch"
    :dir "."
    :cmd "ENABLE_DB_SYNC_LOCAL=true yarn watch"}])

(defn start
  []
  (println "Starting db-sync processes in foreground.")
  (println "Use Ctrl-C to stop.")
  (let [procs (mapv (fn [{:keys [name dir cmd]}]
                      (println "Running:" name "-" cmd)
                      (process ["bash" "-lc" cmd] {:dir dir :inherit true}))
                    processes)]
    (doseq [proc procs]
      @proc)))
