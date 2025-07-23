(ns logseq.cli
  "Main ns for Logseq CLI"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.commands.export-edn :as cli-export-edn]
            [logseq.cli.commands.graph :as cli-graph]
            [logseq.cli.commands.query :as cli-query]
            [logseq.cli.common.graph :as cli-common-graph]
            [nbb.error :as error]))

(defn- format-commands [{:keys [table]}]
  (let [table (mapv (fn [{:keys [cmds desc spec]}]
                      (cond-> [(str (string/join " " cmds)
                                    (when spec " [options]"))]
                        desc (conj desc)))
                    (filter (comp seq :cmds) table))]
    (cli/format-table {:rows table})))

(def ^:private default-spec
  {:version {:coerce :boolean
             :alias :v
             :desc "Print version"}})

(declare table)
(defn- help [_m]
  (println (str "Usage: logseq [command] [options]\n\nOptions:\n"
                (cli/format-opts {:spec default-spec})))
  (println (str "\nCommands:\n" (format-commands {:table table}))))

(defn- default-command
  [{{:keys [version]} :opts :as m}]
  (if version
    (let [package-json (node-path/join (node-path/dirname (second js/process.argv)) "package.json")]
      (when (fs/existsSync package-json)
        (println (-> (fs/readFileSync package-json)
                     js/JSON.parse
                     (aget "version")))))
    (help m)))

(defn- command-help [{{:keys [command]} :opts}]
  (if-let [cmd-map (and command (some #(when (= command (first (:cmds %))) %) table))]
    (println (str "Usage: logseq " command
                  (when (:args->opts cmd-map)
                    (str " " (string/join " "
                                          (map #(str "[" (name %) "]") (:args->opts cmd-map)))))
                  (when (:spec cmd-map)
                    (str " [options]\n\nOptions:\n"
                         (cli/format-opts {:spec (:spec cmd-map)})))))
    (println "Command" (pr-str command) "does not exist")))

(def ^:private table
  [{:cmds ["list"] :fn cli-graph/list-graphs :desc "List graphs"}
   {:cmds ["show"] :fn cli-graph/show-graph :desc "Show DB graph(s) info"
    :args->opts [:graphs] :coerce {:graphs []}}
   {:cmds ["query"] :fn cli-query/query :desc "Query DB graph(s)"
    :args->opts [:graph :queries] :coerce {:queries []} :no-keyword-opts true
    :spec cli-query/spec}
   {:cmds ["export-edn"] :fn cli-export-edn/export :desc "Export DB graph as EDN"
    :args->opts [:graph] :spec cli-export-edn/spec}
   {:cmds ["help"] :fn command-help :desc "Print a command's help"
    :args->opts [:command]}
   {:cmds []
    :spec default-spec
    :fn default-command}])

(defn- error-if-db-version-not-installed
  []
  (when-not (fs/existsSync (cli-common-graph/get-db-graphs-dir))
    (println "Error: The database version's desktop app is not installed. Please install per https://github.com/logseq/logseq/#-database-version.")
    (js/process.exit 1)))

(defn ^:api -main [& args]
  (when-not (contains? #{nil "-h" "--help"} (first args))
    (error-if-db-version-not-installed))
  (try
    (cli/dispatch table args {:coerce {:depth :long}})
    (catch ^:sci/error js/Error e
      (error/print-error-report e))))

#js {:main -main}