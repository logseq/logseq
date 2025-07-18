(ns logseq.cli.commands.graph
  "Graph related commands"
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.common.config :as common-config]))

(defn list-graphs
  []
  (let [[db-graphs* file-graphs*] ((juxt filter remove) #(string/starts-with? % common-config/db-version-prefix)
                                                        (cli-common-graph/get-db-based-graphs))
        db-graphs (->> db-graphs*
                       (map #(string/replace-first % common-config/db-version-prefix ""))
                       sort)
        file-graphs (->> file-graphs*
                         (map #(string/replace-first % common-config/file-version-prefix ""))
                         (map node-path/basename)
                         sort)]
    (println "DB Graphs:")
    (println (string/join "\n" db-graphs))
    (println "\nFile Graphs:")
    (println (string/join "\n" file-graphs))))