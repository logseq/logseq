(ns logseq.cli.commands.graph
  "Graph related commands"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs-time.coerce :as tc]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.cli.util :as cli-util]
            [logseq.common.config :as common-config]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]))

(defn- ms->journal-title
  [ms]
  (date-time-util/format (tc/from-long ms) "MMM do, yyyy"))

(defn show-graph
  [{{:keys [graphs]} :opts}]
  (doseq [graph graphs]
    (let [graph-dir (cli-util/get-graph-path graph)]
      (if (fs/existsSync graph-dir)
        (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
              _ (cli-util/ensure-db-graph-for-command @conn)
              kv-value #(:kv/value (d/entity @conn %))]
          (pprint/print-table
           (map #(array-map "Name" (first %) "Value" (second %))
                (cond-> [["Graph directory" graph-dir]
                         ["Graph created at" (some-> (kv-value :logseq.kv/graph-created-at) ms->journal-title)]
                         ["Graph schema version" (kv-value :logseq.kv/schema-version)]
                         ["Graph initial schema version" (kv-value :logseq.kv/graph-initial-schema-version)]]
                  (d/entity @conn :logseq.kv/graph-git-sha)
                  (conj ["Graph created by commit"
                         (str "https://github.com/logseq/logseq/commit/" (kv-value :logseq.kv/graph-git-sha))])
                  (d/entity @conn :logseq.kv/import-type)
                  (conj ["Graph imported by" (kv-value :logseq.kv/import-type)])))))
        (cli-util/error "Graph" (pr-str graph) "does not exist")))))

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