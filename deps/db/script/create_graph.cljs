(ns create-graph
  "An example script that creates a DB graph given a sqlite.build EDN file"
  (:require [logseq.outliner.cli :as outliner-cli]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            ["fs" :as fs]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(defn -main [args]
  (when (not= 2 (count args))
    (println "Usage: $0 GRAPH-DIR EDN-PATH")
    (js/process.exit 1))
  (let [[graph-dir edn-path] args
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        sqlite-build-edn (merge {:auto-create-ontology? true}
                                (-> (resolve-path edn-path) fs/readFileSync str edn/read-string))
        conn (outliner-cli/init-conn dir db-name {:classpath (cp/get-classpath)})
        {:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx sqlite-build-edn)]
    (println "Generating" (count (filter :block/name init-tx)) "pages and"
             (count (filter :block/title init-tx)) "blocks ...")
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
