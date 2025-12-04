(ns logseq.cli.commands.validate
  "Validate graph command"
  (:require ["fs" :as fs]
            [cljs.pprint :as pprint]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.validate :as db-validate]))

(defn- validate-db [db db-name options]
  (if-let [errors (:errors
                   (db-validate/validate-local-db!
                    db
                    (merge options {:db-name db-name :verbose true})))]
    (do
      (println "Found" (count errors)
               (if (= 1 (count errors)) "entity" "entities")
               "with errors:")
      (pprint/pprint errors)
      (js/process.exit 1))
    (println "Valid!")))

(defn- validate-graph [graph options]
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
          _ (cli-util/ensure-db-graph-for-command @conn)]
      (validate-db @conn graph options))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))

(defn validate [{{:keys [graphs] :as opts} :opts}]
  (doseq [graph graphs]
    (validate-graph graph opts)))
