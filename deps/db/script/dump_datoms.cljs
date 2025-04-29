  (ns dump-datoms
    "A script that dumps all eavt datoms to a specified edn file

     $ yarn -s nbb-logseq script/dump_datoms.cljs db-name datoms.edn"
    (:require ["fs" :as fs]
              ["os" :as os]
              ["path" :as path]
              [clojure.pprint :as pprint]
              [datascript.core :as d]
              [logseq.db.common.sqlite-cli :as sqlite-cli]
              [nbb.core :as nbb]))

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

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))