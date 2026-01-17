(ns logseq.cli
  "Main ns for Logseq CLI"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.cli.spec :as cli-spec]
            [logseq.cli.text-util :as cli-text-util]
            [nbb.error]
            [promesa.core :as p]))

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
(defn- print-general-help [_m]
  (println (str "Usage: logseq [command] [options]\n\nOptions:\n"
                (cli/format-opts {:spec default-spec})))
  (println (str "\nCommands:\n" (format-commands {:table table}))))

(defn- default-command
  [{{:keys [version]} :opts :as m}]
  (if version
    (let [package-json (node-path/join js/__dirname "package.json")]
      (when (fs/existsSync package-json)
        (println (-> (fs/readFileSync package-json)
                     js/JSON.parse
                     (aget "version")))))
    (print-general-help m)))

(defn- print-command-help [command cmd-map]
  (println (str "Usage: logseq " command
                (when (:args->opts cmd-map)
                  (str " " (string/join " "
                                        (map #(str "[" (name %) "]") (:args->opts cmd-map)))))
                (when (:spec cmd-map)
                  (str " [options]\n\nOptions:\n"
                       (cli/format-opts {:spec (:spec cmd-map)})))
                (when (:description cmd-map)
                  (str "\n\nDescription:\n" (cli-text-util/wrap-text (:description cmd-map) 80))))))

(defn- help-command [{{:keys [command help]} :opts}]
  (if-let [cmd-map (and command (some #(when (= command (first (:cmds %))) %) table))]
    (print-command-help command cmd-map)
    ;; handle help --help
    (if-let [cmd-map (and help (some #(when (= "help" (first (:cmds %))) %) table))]
      (print-command-help "help" cmd-map)
      (println "Command" (pr-str command) "does not exist"))))

(defn- lazy-load-fn
  "Lazy load fn to speed up start time. After nbb requires ~30 namespaces, start time gets close to 1s.
   Also handles --help on all commands"
  [fn-sym]
  (fn [& args]
    (if (get-in (first args) [:opts :help])
      (help-command {:opts {:command (-> args first :dispatch first)}})
      (-> (p/let [_ (require (symbol (namespace fn-sym)))]
            (apply (resolve fn-sym) args))
          (p/catch (fn [err]
                     (if (= :sci/error (:type (ex-data err)))
                       (nbb.error/print-error-report err)
                       (js/console.error "Error:" err))
                     (js/process.exit 1)))))))

(def ^:private table*
  [{:cmds ["list"] :desc "List local graphs"
    :fn (lazy-load-fn 'logseq.cli.commands.graph/list-graphs)}
   {:cmds ["show"] :desc "Show DB graph(s) info"
    :description "For each graph, prints information related to a graph's creation and anything that is helpful for debugging."
    :fn (lazy-load-fn 'logseq.cli.commands.graph/show-graph)
    :args->opts [:graphs] :coerce {:graphs []} :require [:graphs]}
   {:cmds ["search"]
    :fn (lazy-load-fn 'logseq.cli.commands.search/search)
    :desc "Search DB graph"
    :description "Search a local graph or the current in-app graph if --api-server-token is given. For a local graph it only searches the :block/title of blocks."
    :args->opts [:search-terms] :coerce {:search-terms []}
    :spec cli-spec/search}
   {:cmds ["query"] :desc "Query DB graph(s)"
    :description "Query a local graph or the current in-app graph if --api-server-token is given. For a local graph, queries are a datalog query or an entity query. A datalog query can use built-in rules. An entity query consists of one or more integers, uuids or :db/ident keywords. For an in-app query, queries can be an advanced or simple query."
    :fn (lazy-load-fn 'logseq.cli.commands.query/query)
    :args->opts [:args] :coerce {:args []} :no-keyword-opts true
    :spec cli-spec/query}
   {:cmds ["export"] :desc "Export DB graph as Markdown"
    :description "Export a local graph to Markdown like the in-app graph export."
    :fn (lazy-load-fn 'logseq.cli.commands.export/export)
    :spec cli-spec/export}
   {:cmds ["export-edn"] :desc "Export DB graph as EDN"
    :description "Export a local graph to EDN or the current in-app graph if --api-server-token is given. See https://github.com/logseq/docs/blob/master/db-version.md#edn-data-export for more about this export type."
    :fn (lazy-load-fn 'logseq.cli.commands.export-edn/export)
    :spec cli-spec/export-edn}
   {:cmds ["import-edn"] :desc "Import into DB graph with EDN"
    :description "Import with EDN into a local graph or the current in-app graph if --api-server-token is given. See https://github.com/logseq/docs/blob/master/db-version.md#edn-data-export for more about this import type."
    :fn (lazy-load-fn 'logseq.cli.commands.import-edn/import-edn)
    :spec cli-spec/import-edn}
   {:cmds ["append"] :desc "Append text to current page"
    :description "Append text to current page of current in-app graph."
    :fn (lazy-load-fn 'logseq.cli.commands.append/append)
    :args->opts [:args] :require [:args] :coerce {:args []}
    :spec cli-spec/append}
   {:cmds ["mcp-server"] :desc "Run a MCP server"
    :description "Run a MCP server against a local graph if --repo is given or against the current in-app graph. For the in-app graph, the API server must be on in the app. By default the MCP server runs as a HTTP Streamable server. Use --stdio to run it as a stdio server."
    :fn (lazy-load-fn 'logseq.cli.commands.mcp-server/start)
    :spec cli-spec/mcp-server}
   {:cmds ["validate"] :desc "Validate DB graph"
    :description "Validate a local DB graph. Exit 1 if there are validation errors"
    :fn (lazy-load-fn 'logseq.cli.commands.validate/validate)
    :spec cli-spec/validate}
   {:cmds ["help"] :fn help-command :desc "Print a command's help"
    :args->opts [:command] :require [:command]}
   {:cmds []
    :spec default-spec
    :fn default-command}])

;; Spec shared with all commands
(def ^:private shared-spec
  {:help {:alias :h
          :desc "Print help"}})

(def ^:private table
  (mapv (fn [m] (update m :spec #(merge % shared-spec))) table*))

(defn- warn-if-db-version-not-installed
  []
  (when-not (fs/existsSync (cli-common-graph/get-db-graphs-dir))
    (println "[WARN] The database version's desktop app is not installed. Please install per https://github.com/logseq/logseq/#-database-version.")))

(defn ^:api -main [& args]
  (warn-if-db-version-not-installed)
  (try
    (cli/dispatch table
                  args
                  {:error-fn (fn [{:keys [cause msg option opts] type' :type :as data}]
                               ;; Options aren't required when printing help
                               (when-not (:help opts)
                                 (if (and (= :org.babashka/cli type')
                                          (= :require cause))
                                   (do
                                     (println "Error: Command missing required"
                                              (if (get-in data [:spec option]) "option" "argument")
                                              (pr-str (name option)))
                                     (when-let [cmd-m (some #(when (= {:spec (:spec %)
                                                                       :require (:require %)}
                                                                      (select-keys data [:spec :require])) %) table)]
                                       (print-command-help (-> cmd-m :cmds first) cmd-m)))
                                   (throw (ex-info msg data)))
                                 (js/process.exit 1)))})
    (catch ^:sci/error js/Error e
      (nbb.error/print-error-report e)
      (js/process.exit 1))))

#js {:main -main}
