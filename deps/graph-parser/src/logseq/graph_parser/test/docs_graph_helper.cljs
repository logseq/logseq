(ns logseq.graph-parser.test.docs-graph-helper
  "Helper fns for setting up and running tests against docs graph"
  (:require ["child_process" :as child-process]
            ["fs" :as fs]))

;; Helper fns for test setup
;; =========================
(defn- sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
    to be similar to babashka.tasks/shell"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

(defn clone-docs-repo-if-not-exists
  [dir branch]
  (when-not (.existsSync fs dir)
    (sh ["git" "clone" "--depth" "1" "-b" branch "-c" "advice.detachedHead=false"
         "https://github.com/logseq/docs" dir] {})))