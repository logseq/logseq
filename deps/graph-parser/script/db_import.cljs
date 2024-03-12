(ns db-import
  "Imports given file(s) to a db graph. This script is primarily for
   developing the import feature and for engineers who want to customize
   the import process"
  (:require [clojure.string :as string]
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
  [dir*]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (mapv #(hash-map :rpath %)))))

(defn- <read-file
  [file]
  (p/let [s (fsp/readFile (:rpath file))]
    (str s)))

(defn- build-import-options [conn config options]
  (-> (gp-exporter/setup-import-options
       @conn
       {}
       (select-keys options [:tag-classes :property-classes])
       {:notify-user prn :macros (:macros config)})
      (assoc-in [:extract-options :verbose] (:verbose options))))

(defn- <copy-asset-file [file db-graph-dir file-graph-dir]
  (p/let [parent-dir (node-path/dirname
                      (node-path/join db-graph-dir (node-path/relative file-graph-dir (:rpath file))))
          _ (fsp/mkdir parent-dir #js {:recursive true})]
    (fsp/copyFile (:rpath file) (node-path/join parent-dir (node-path/basename (:rpath file))))))

(defn- import-file-graph-to-db [file-graph-dir db-graph-dir conn options]
  (p/let [*files (build-graph-files file-graph-dir)
          config-file (first (filter #(string/ends-with? (:rpath %) "logseq/config.edn") *files))
          _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
          ;; TODO: Add :default-config option
          config (gp-exporter/import-config-file! conn config-file <read-file {:notify-user prn})
          files (remove-hidden-files file-graph-dir config *files)
          import-options (build-import-options conn config options)
          logseq-file? #(string/includes? (:rpath %) "logseq/")
          asset-files (when (fs/existsSync (node-path/join file-graph-dir "assets"))
                        (map #(hash-map :rpath %) (common-graph/readdir (node-path/join file-graph-dir "assets"))))
          doc-files (remove logseq-file? files)
          logseq-files (filter logseq-file? files)]
    (println "Importing" (count files) "files ...")
    (p/do!
     (gp-exporter/import-logseq-files conn logseq-files <read-file {:notify-user prn})
     (gp-exporter/import-from-asset-files! asset-files #(<copy-asset-file % db-graph-dir file-graph-dir) {:notify-user prn})
     (gp-exporter/import-from-doc-files! conn doc-files <read-file import-options)
     (gp-exporter/import-favorites-from-config-edn! conn conn config {})
     (gp-exporter/import-class-properties conn conn))))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(defn- import-files-to-db [file conn {:keys [files] :as options}]
  (let [import-options (build-import-options conn {:macros {}} options)
        files' (mapv #(hash-map :rpath %)
                     (into [file] (map resolve-path files)))]
    (gp-exporter/import-from-doc-files! conn files' <read-file import-options)))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Verbose mode"}
   :tag-classes {:alias :t
                 :coerce []
                 :desc "List of tags to convert to classes"}
   :files {:alias :f
           :coerce []
           :desc "Additional files to import"}
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
                        (let [graph-dir' (resolve-path db-graph-dir)]
                          ((juxt node-path/dirname node-path/basename) graph-dir'))
                        [(node-path/join (os/homedir) "logseq" "graphs") db-graph-dir])
        file-graph' (resolve-path file-graph)
        conn (create-graph/init-conn dir db-name)
        directory? (.isDirectory (fs/statSync file-graph'))]
    (p/do!
     (if directory?
       (import-file-graph-to-db file-graph' (node-path/join dir db-name) conn (merge options {:graph-name db-name}))
       (import-files-to-db file-graph' conn (merge options {:graph-name db-name})))
     (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
     (println "Created graph" (str db-name "!")))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))