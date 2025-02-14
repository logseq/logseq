  (ns dump-datoms
    "An example script that dumps all eavt datoms to a specified edn file

     $ yarn -s nbb-logseq script/dump_datoms.cljs db-name datoms.edn"
    (:require [datascript.core :as d]
              [clojure.pprint :as pprint]
              [logseq.db.sqlite.cli :as sqlite-cli]
              [nbb.core :as nbb]
              ["path" :as path]
              ["os" :as os]
              ["fs" :as fs]))

(defn read-graph
  "The db graph bare version of gp-cli/parse-graph"
  [graph-name]
  (let [graphs-dir (path/join (os/homedir) "logseq/graphs")]
    (sqlite-cli/open-db! graphs-dir graph-name)))

(defn -main [args]
  (when (< (count args) 2)
    (println "Usage: $0 GRAPH FILE")
    (js/process.exit 1))
  (let [[graph-name file*] args
        conn (read-graph graph-name)
        datoms (mapv #(vec %) (d/datoms @conn :eavt))
        parent-dir (or js/process.env.ORIGINAL_PWD ".")
        file (path/join parent-dir file*)]
    (println "Writing" (count datoms) "datoms to" file)
    (fs/writeFileSync file (with-out-str (pprint/pprint datoms)))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))