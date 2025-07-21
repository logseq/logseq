(ns logseq.cli
  "Main ns for Logseq CLI"
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.commands.graph :as cli-graph]))

(defn- format-commands [{:keys [table]}]
  (let [table (mapv (fn [{:keys [cmds desc]}]
                      (cond-> [(string/join " " cmds)]
                        desc (conj desc)))
                    (filter (comp seq :cmds) table))]
    (cli/format-table {:rows table})))

(declare table)
(defn- help [_m]
  (println "Usage: logseq [command] [options]\n\nCommands:")
  (println (format-commands {:table table})))

(def ^:private table
  [{:cmds ["list"] :fn cli-graph/list-graphs :desc "List graphs"}
   {:cmds ["show"] :fn cli-graph/show-graph :args->opts [:graphs] :desc "Show graph(s) info"
    :coerce {:graphs []}}
   {:cmds []         :fn help}])

(defn ^:api -main [& args]
  (cli/dispatch table args {:coerce {:depth :long}}))

#js {:main -main}