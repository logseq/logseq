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
            [nbb.classpath :as cp]
            [babashka.cli :as cli]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.common.graph :as common-graph]
            #_:clj-kondo/ignore
            [logseq.outliner.cli :as outliner-cli]
            [promesa.core :as p]))

(defn- build-graph-files
  "Given a file graph directory, return all files including assets and adds relative paths
   on ::rpath since paths are absolute by default and exporter needs relative paths for
   some operations"
  [dir*]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (concat (when (fs/existsSync (node-path/join dir* "assets"))
                   (common-graph/readdir (node-path/join dir* "assets"))))
         (mapv #(hash-map :path %
                          ::rpath (node-path/relative dir* %))))))

(defn- <read-file
  [file]
  (p/let [s (fsp/readFile (:path file))]
    (str s)))

(defn- <copy-asset-file [file db-graph-dir file-graph-dir]
  (p/let [parent-dir (node-path/dirname
                      (node-path/join db-graph-dir (node-path/relative file-graph-dir (:path file))))
          _ (fsp/mkdir parent-dir #js {:recursive true})]
    (fsp/copyFile (:path file) (node-path/join parent-dir (node-path/basename (:path file))))))

(defn- notify-user [m]
  (println (:msg m))
  (when (:ex-data m)
    (println "Ex-data:" (pr-str (dissoc (:ex-data m) :error)))
    (println "Stacktrace:")
    (if-let [stack (some-> (get-in m [:ex-data :error]) ex-data :sci.impl/callstack deref)]
      (println (string/join
                "\n"
                (map
                 #(str (:file %)
                       (when (:line %) (str ":" (:line %)))
                       (when (:sci.impl/f-meta %)
                         (str " calls #'" (get-in % [:sci.impl/f-meta :ns]) "/" (get-in % [:sci.impl/f-meta :name]))))
                 (reverse stack))))
      (println (some-> (get-in m [:ex-data :error]) .-stack))))
  (when (= :error (:level m))
    (js/process.exit 1)))

(def default-export-options
  {;; common options
   :rpath-key ::rpath
   :notify-user notify-user
   :<read-file <read-file
   ;; :set-ui-state prn
   ;; config file options
   ;; TODO: Add actual default
   :default-config {}})

(defn- import-file-graph-to-db
  "Import a file graph dir just like UI does. However, unlike the UI the
  exporter receives file maps containing keys :path and ::rpath since :path
  are full paths"
  [file-graph-dir db-graph-dir conn options]
  (let [*files (build-graph-files file-graph-dir)
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") *files))
        _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
        options (merge options
                       default-export-options
                        ;; asset file options
                       {:<copy-asset (fn copy-asset [file]
                                       (<copy-asset-file file db-graph-dir file-graph-dir))})]
    (gp-exporter/export-file-graph conn conn config-file *files options)))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(defn- import-files-to-db
  "Import specific doc files for dev purposes"
  [file conn {:keys [files] :as options}]
  (let [doc-options (gp-exporter/build-doc-options {:macros {}} (merge options default-export-options))
        files' (mapv #(hash-map :path %)
                     (into [file] (map resolve-path files)))]
    (gp-exporter/export-doc-files conn files' <read-file doc-options)))

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
                      :desc "List of properties whose values convert to classes"}
   :property-parent-classes
   {:alias :P
    :coerce []
    :desc "List of properties whose values convert to a parent class"}})

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
        conn (outliner-cli/init-conn dir db-name {:classpath (cp/get-classpath)})
        directory? (.isDirectory (fs/statSync file-graph'))
        ;; coerce option collection into strings
        options' (if (:tag-classes options) (update options :tag-classes (partial mapv str)) options)]
    (p/do!
     (if directory?
       (import-file-graph-to-db file-graph' (node-path/join dir db-name) conn (merge options' {:graph-name db-name}))
       (import-files-to-db file-graph' conn (merge options' {:graph-name db-name})))
     (when (:verbose options') (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
     (println "Created graph" (str db-name "!")))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))