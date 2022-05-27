(ns logseq.bb-tasks.nbb.watch
  "To use tasks in this ns, first install nbb-logseq:
`npm install -g @logseq/nbb-logseq`"
  (:require [pod.babashka.fswatcher :as fw]
            [babashka.tasks :refer [shell]]
            [babashka.classpath :as classpath]))

(def last-file (atom nil))

(defn- run-script
  [nbb-script dir file]
  (shell "nbb-logseq -cp" (classpath/get-classpath) nbb-script dir file))

(defn watch-dir
  "Watch a graph dir and nbb script and run nbb script when either changes.
Nbb takes graph dir and last modified graph file.
NOTE: If the script fails, the watcher stops watching"
  [& args]
  (when-not (= 2 (count args))
    (throw (ex-info "Usage: $0 DIR NBB-SCRIPT" {})))
  (let [[dir nbb-script] args]
    (println "Watching" dir "...")
    (fw/watch dir
              (fn [event]
                ;; Don't use :chmod as it sometimes triggers twice on osx
                (when (#{:write|chmod :write} (:type event))
                  (run-script nbb-script dir (:path event))
                  (reset! last-file (:path event))))
              {:recursive true})
    ;; Get live-editing experience by re-parsing last file
    (fw/watch nbb-script
              (fn [event]
                (when (#{:write|chmod :write} (:type event))
                  (run-script nbb-script dir @last-file))))
    (deref (promise))))
