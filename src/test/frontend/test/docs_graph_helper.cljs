(ns ^:nbb-compatible frontend.test.docs-graph-helper
  "Helper fns for running tests against docs graph"
  (:require ["fs" :as fs]
            ["child_process" :as child-process]
            [clojure.string :as string]))


(defn- slurp
  "Like clojure.core/slurp"
  [file]
  (str (fs/readFileSync file)))

(defn- sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
    to be similar to babashka.tasks/shell"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

(defn build-graph-files
  [dir]
  (let [files (->> (str (.-stdout (sh ["git" "ls-files"]
                                      {:cwd dir :stdio nil})))
                   string/split-lines
                   (filter #(re-find #"^(pages|journals)" %))
                   (map #(str dir "/" %)))]
    (mapv #(hash-map :file/path % :file/content (slurp %)) files)))

(defn clone-docs-repo-if-not-exists
  [dir]
  (when-not (.existsSync fs dir)
    (sh ["git" "clone" "--depth" "1" "-b" "v0.6.7" "-c" "advice.detachedHead=false"
         "https://github.com/logseq/docs" dir] {})))
