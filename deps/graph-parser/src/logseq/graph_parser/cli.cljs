(ns logseq.graph-parser.cli
  "Primary ns to parse graphs with node.js based CLIs"
  (:require ["fs" :as fs]
            ["child_process" :as child-process]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.graph-parser :as graph-parser]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
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
  ;; -z needed to avoid quoting unusual paths that cause slurp failures.
  ;; See https://git-scm.com/docs/git-ls-files#_output for more
  (let [files (->> (str (.-stdout (sh ["git" "ls-files" "-z"]
                                      {:cwd dir :stdio nil})))
                   (#(string/split % (re-pattern "\0")))
                   (map #(hash-map :file/path (str dir "/" %)))
                   graph-parser/filter-files)]
    (mapv #(assoc % :file/content (slurp (:file/path %))) files)))

(defn- read-config
  "Reads repo-specific config from logseq/config.edn"
  [dir]
  (let [config-file (str dir "/" gp-config/app-name "/config.edn")]
    (if (fs/existsSync config-file)
     (-> config-file fs/readFileSync str edn/read-string)
     {})))

(defn- parse-files
  [conn files {:keys [config] :as options}]
  (let [extract-options (merge {:date-formatter (gp-config/get-date-formatter config)
                                :user-config config
                                :filename-format (or (:file/name-format config) :legacy)
                                :extracted-block-ids (atom #{})}
                               (select-keys options [:verbose]))]
    (mapv
     (fn [{:file/keys [path content]}]
       (let [{:keys [ast]}
             (let [parse-file-options
                   (merge {:extract-options
                           (assoc extract-options
                                  :block-pattern (gp-config/get-block-pattern (gp-util/get-format path)))}
                          (:parse-file-options options))]
               (graph-parser/parse-file conn path content parse-file-options))]
         {:file path :ast ast}))
     files)))

(defn parse-graph
  "Parses a given graph directory and returns a datascript connection and all
  files that were processed. The directory is parsed as if it were a new graph
  as it can't assume that the metadata in logseq/ is up to date. Directory is
  assumed to be using git. This fn takes the following options:
* :verbose - When enabled prints more information during parsing. Defaults to true
* :files - Specific files to parse instead of parsing the whole directory
* :conn - Database connection to use instead of creating new one
* :parse-file-options - Options map to pass to graph-parser/parse-file"
  ([dir]
   (parse-graph dir {}))
  ([dir options]
   (let [files (or (:files options) (build-graph-files dir))
         conn (or (:conn options) (ldb/start-conn))
         config (read-config dir)
        _ (when-not (:files options) (println "Parsing" (count files) "files..."))
         asts (parse-files conn files (merge options {:config config}))]
     {:conn conn
      :files (map :file/path files)
      :asts asts})))
