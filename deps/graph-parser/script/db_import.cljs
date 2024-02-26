(ns db-import
  "Imports given file(s) to a db graph. This script is primarily for
   developing the import feature and for engineers who want to customize
   the import process"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            ["fs" :as fs]
            [nbb.core :as nbb]
            [babashka.cli :as cli]
            [logseq.common.config :as common-config]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.tasks.db-graph.create-graph :as create-graph]))

(defn- setup-import-options
  [db config user-options]
  {:extract-options {:date-formatter (common-config/get-date-formatter config)
                     :user-config config
                     :filename-format (or (:file/name-format config) :legacy)}
   :user-options user-options
   :page-tags-uuid (:block/uuid (d/entity db [:block/name "pagetags"]))
   :import-state (gp-exporter/new-import-state)
   :macros (:macros config)})

(defn- import-file-graph-to-db [file-graph conn db-name]
  ;; TODO: Read in repo config
  (let [import-options (setup-import-options @conn
                                             {:file/name-format :triple-lowbar}
                                             {:graph-name db-name})
        ;; TODO: Read files dir and port more from import
        file file-graph
        m {:file/path file
           :file/content (str (fs/readFileSync file))}]
    (gp-exporter/add-file-to-db-graph conn (:file/path m) (:file/content m) import-options)))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

(defn -main [args]
  (let [[file-graph db-graph-dir] args
        options (cli/parse-opts args {:spec spec})
        _ (when (or (< (count args) 2) (:help options))
            (println (str "Usage: $0 FILE-GRAPH DB-GRAPH [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        [dir db-name] (if (string/includes? db-graph-dir "/")
                        (let [graph-dir'
                              (node-path/join (or js/process.env.ORIGINAL_PWD ".") db-graph-dir)]
                          ((juxt node-path/dirname node-path/basename) graph-dir'))
                        [(node-path/join (os/homedir) "logseq" "graphs") db-graph-dir])
        file-graph' (node-path/join (or js/process.env.ORIGINAL_PWD ".") file-graph)
        conn (create-graph/init-conn dir db-name)]
    (import-file-graph-to-db file-graph' conn db-name)
    (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))