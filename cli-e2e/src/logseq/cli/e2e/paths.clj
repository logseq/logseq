(ns logseq.cli.e2e.paths
  (:require [babashka.fs :as fs]))

(defn- ancestors
  [path]
  (take-while some? (iterate fs/parent path)))

(defn- find-parent-named
  [path name]
  (some (fn [candidate]
          (when (= name (fs/file-name candidate))
            candidate))
        (ancestors (fs/canonicalize path))))

(defn cli-e2e-root
  []
  (or (find-parent-named *file* "cli-e2e")
      (throw (ex-info "Unable to locate cli-e2e root"
                      {:file *file*}))))

(defn repo-root
  []
  (str (fs/parent (cli-e2e-root))))

(defn repo-path
  [& segments]
  (str (apply fs/path (repo-root) segments)))

(defn cli-e2e-path
  [& segments]
  (str (apply fs/path (cli-e2e-root) segments)))

(defn spec-path
  [filename]
  (cli-e2e-path "spec" filename))

(defn required-artifacts
  []
  [(repo-path "static" "logseq-cli.js")
   (repo-path "static" "db-worker-node.js")
   (repo-path "dist" "db-worker-node.js")
   (repo-path "dist" "db-worker-node-assets.json")])
