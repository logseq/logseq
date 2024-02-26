(ns db-import
  "Imports given file(s) to a db graph. This script is primarily for
   developing the import feature and for engineers who want to customize
   the import process"
  (:require [clojure.string :as string]
            [clojure.edn :as edn]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            ["fs" :as fs]
            ["fs/promises" :as fsp]
            [nbb.core :as nbb]
            [babashka.cli :as cli]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.common.graph :as common-graph]
            [logseq.common.config :as common-config]
            [logseq.tasks.db-graph.create-graph :as create-graph]
            [promesa.core :as p]))

(defn- remove-hidden-files [dir config files]
  (if (seq (:hidden config))
    (->> files
         (map #(assoc % ::rel-path (node-path/relative dir (:rpath %))))
         ((fn [files] (common-config/remove-hidden-files files config ::rel-path)))
         (map #(dissoc % ::rel-path)))
    files))

(defn- build-graph-files
  "Given a graph directory, return absolute, allowed file paths and their contents in preparation
   for parsing"
  [dir* config]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (mapv #(hash-map :rpath %))
         (remove-hidden-files dir config))))

(defn- read-config
  "Reads repo-specific config from logseq/config.edn"
  [dir]
  (let [config-file (str dir "/" common-config/app-name "/config.edn")]
    (if (fs/existsSync config-file)
      (-> config-file fs/readFileSync str edn/read-string)
      {})))

(defn- import-file-graph-to-db [file-graph-dir conn user-options]
  (let [config (read-config file-graph-dir)
        import-options (gp-exporter/setup-import-options
                        @conn
                        config
                        user-options
                        {:notify-user prn})
        ;; TODO: Remove logseq/ filter when higher-level import fn is available
        files (remove #(re-find #"logseq/" (:rpath %)) (build-graph-files file-graph-dir config))]
    ;; (prn :files (count files) files)
    (gp-exporter/import-from-doc-files!
     conn files #(p/let [s (fsp/readFile (:rpath %))] (str s)) import-options)))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Verbose mode"}
   :tag-classes {:alias :t
                 :coerce []
                 :desc "List of tags to convert to classes"}
   :property-classes {:alias :p
                      :coerce []
                      :desc "List of properties whose values convert to classes"}})

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
    (p/do!
     (import-file-graph-to-db file-graph' conn (merge options {:graph-name db-name}))
     (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
     (println "Created graph" (str db-name "!")))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))