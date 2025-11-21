(ns logseq.cli.commands.validate
  "Validate graph command"
  (:require ["fs" :as fs]
            [cljs.pprint :as pprint]
            [datascript.core :as d]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.validate :as db-validate]
            [malli.error :as me]))

(defn- validate-db*
  "Validate datascript db as a vec of entity maps"
  [db ent-maps* {:keys [closed]}]
  (let [ent-maps (db-malli-schema/update-properties-in-ents db ent-maps*)
        explainer (db-validate/get-schema-explainer closed)]
    (if-let [explanation (binding [db-malli-schema/*db-for-validate-fns* db
                                   db-malli-schema/*closed-values-validate?* true]
                           (->> (map (fn [e] (dissoc e :db/id)) ent-maps) explainer not-empty))]
      (let [ent-errors
            (->> (db-validate/group-errors-by-entity db ent-maps (:errors explanation))
                 (map #(update % :errors
                               (fn [errs]
                                 ;; errs looks like: {178 {:logseq.property/hide? ["disallowed key"]}}
                                 ;; map is indexed by :in which is unused since all errors are for the same map
                                 (->> (me/humanize {:errors errs})
                                      vals
                                      (apply merge-with into))))))]
        (println "Found" (count ent-errors)
                 (if (= 1 (count ent-errors)) "entity" "entities")
                 "with errors:")
        (pprint/pprint ent-errors)
        (js/process.exit 1))
      (println "Valid!"))))

(defn- validate-db [db db-name options]
  (let [datoms (d/datoms db :eavt)
        ent-maps (db-malli-schema/datoms->entities datoms)]
    (println "Read graph" (str db-name " with counts: "
                               (pr-str (assoc (db-validate/graph-counts db ent-maps)
                                              :datoms (count datoms)))))
    (validate-db* db ent-maps options)))

(defn- validate-graph [graph options]
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
          _ (cli-util/ensure-db-graph-for-command @conn)]
      (validate-db @conn graph options))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))

(defn validate [{{:keys [graphs] :as opts} :opts}]
  (doseq [graph graphs]
    (validate-graph graph opts)))
