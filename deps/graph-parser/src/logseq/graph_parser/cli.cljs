(ns logseq.graph-parser.cli
  "Primary ns to parse graphs with node.js based CLIs"
  (:require ["fs" :as fs]
            ["child_process" :as child-process]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.config :as gp-config]
            [logseq.db :as ldb]))

(defn slurp
  "Return file contents like clojure.core/slurp"
  [file]
  (str (fs/readFileSync file)))

(defn sh
  "Run shell cmd synchronously and print to inherited streams by default. Aims
    to be similar to babashka.tasks/shell
TODO: Fail fast when process exits 1"
  [cmd opts]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           (clj->js (merge {:stdio "inherit"} opts))))

(defn build-graph-files
  "Given a git graph directory, returns allowed file paths and their contents in
  preparation for parsing"
  [dir]
  (let [files (->> (str (.-stdout (sh ["git" "ls-files"]
                                      {:cwd dir :stdio nil})))
                   string/split-lines
                   (map #(hash-map :file/path (str dir "/" %)))
                   graph-parser/filter-files)]
    (mapv #(assoc % :file/content (slurp (:file/path %))) files)))

(defn- read-config
  "Commandline version of frontend.handler.common/read-config without graceful
  handling of broken config. Config is assumed to be at $dir/logseq/config.edn "
  [dir]
  (let [config-file (str dir "/" gp-config/app-name "/config.edn")]
    (if (fs/existsSync config-file)
     (-> config-file fs/readFileSync str edn/read-string)
     {})))

(defn- parse-files
  [conn files {:keys [config] :as options}]
  (let [extract-options (merge {:date-formatter (gp-config/get-date-formatter config)
                                :user-config config}
                               (select-keys options [:verbose]))]
    (mapv
     (fn [{:file/keys [path content]}]
       (let [{:keys [ast]}
             (graph-parser/parse-file conn path content {:extract-options extract-options})]
         {:file path :ast ast}))
     files)))

(defn parse-graph
  "Parses a given graph directory and returns a datascript connection and all
  files that were processed. The directory is parsed as if it were a new graph
  as it can't assume that the metadata in logseq/ is up to date. Directory is
  assumed to be using git. This fn takes the following options:
* :verbose - When enabled prints more information during parsing. Defaults to true
* :files - Specific files to parse instead of parsing the whole directory"
  ([dir]
   (parse-graph dir {}))
  ([dir options]
   (let [files (or (:files options) (build-graph-files dir))
         conn (ldb/start-conn)
         config (read-config dir)
        _ (when-not (:files options) (println "Parsing" (count files) "files..."))
         asts (parse-files conn files (merge options {:config config}))]
     {:conn conn
      :files (map :file/path files)
      :asts asts})))
