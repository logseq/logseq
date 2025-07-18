(ns logseq.cli
  "Main ns for Logseq CLI"
  (:require [babashka.cli :as cli]
            [clojure.string :as string]
            [logseq.cli.commands.graph :as cli-graph]))

;; TODO
(defn- query [m]
  (prn (assoc m :fn :query)))

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

(def table
  [{:cmds ["list"]   :fn cli-graph/list-graphs   :desc "List graphs"}
   {:cmds ["query"] :fn query :args->opts [:graph] :desc "Query graph"}
   {:cmds []         :fn help}])

(defn -main [& args]
  (cli/dispatch table args {:coerce {:depth :long}}))

#js {:main -main}