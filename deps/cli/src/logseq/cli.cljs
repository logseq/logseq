(ns logseq.cli
  "Main ns for Logseq CLI"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.cli.spec :as cli-spec]
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
(defn- help [_m]
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

(defn- lazy-load-fn
  "Lazy load fn to speed up start time. After nbb requires ~30 namespaces, start time gets close to 1s"
  [fn-sym]
  (fn [& args]
    (-> (p/let [_ (require (symbol (namespace fn-sym)))]
          (apply (resolve fn-sym) args))
        (p/catch (fn [err]
                   (if (= :sci/error (:type (ex-data err)))
                     (nbb.error/print-error-report err)
                     (js/console.error "Error:" err))
                   (js/process.exit 1))))))

(def ^:private table
  [{:cmds ["list"] :desc "List graphs"
    :fn (lazy-load-fn 'logseq.cli.commands.graph/list-graphs)}
   {:cmds ["show"] :desc "Show DB graph(s) info"
    :fn (lazy-load-fn 'logseq.cli.commands.graph/show-graph)
    :args->opts [:graphs] :coerce {:graphs []} :require [:graphs]}
   {:cmds ["search"]
    :fn (lazy-load-fn 'logseq.cli.commands.search/search)
    :desc "Search DB graph"
    :args->opts [:graph :search-terms] :coerce {:search-terms []} :require [:graph]
    :spec cli-spec/search}
   {:cmds ["query"] :desc "Query DB graph(s)"
    :fn (lazy-load-fn 'logseq.cli.commands.query/query)
    :args->opts [:graph :args] :coerce {:args []} :no-keyword-opts true :require [:graph]
    :spec cli-spec/query}
   {:cmds ["export"] :desc "Export DB graph as MD"
    :fn (lazy-load-fn 'logseq.cli.commands.export/export)
    :args->opts [:graph] :require [:graph]}
   {:cmds ["export-edn"] :desc "Export DB graph as EDN"
    :fn (lazy-load-fn 'logseq.cli.commands.export-edn/export)
    :args->opts [:graph] :require [:graph]
    :spec cli-spec/export-edn}
   {:cmds ["help"] :fn command-help :desc "Print a command's help"
    :args->opts [:command] :require [:command]}
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
    (cli/dispatch table
                  args
                  {:error-fn (fn [{:keys [cause msg option] type' :type :as data}]
                               (if (and (= :org.babashka/cli type')
                                        (= :require cause))
                                 (println "Error: Command missing required"
                                          (if (get-in data [:spec option]) "option" "argument")
                                          option)
                                 (throw (ex-info msg data)))
                               (js/process.exit 1))})
    (catch ^:sci/error js/Error e
      (nbb.error/print-error-report e))))

#js {:main -main}