(ns validate-client-db
  "Script that validates the datascript db of a DB graph
   NOTE: This script is also used in CI to confirm our db's schema is up to date"
  (:require ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [cljs.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.cli :as sqlite-cli]
            [malli.core :as m]
            [malli.error :as me]
            [nbb.core :as nbb]))

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [db ent-maps* {:keys [verbose group-errors humanize closed-maps]}]
  (let [ent-maps (db-malli-schema/update-properties-in-ents db ent-maps*)
        explainer (db-validate/get-schema-explainer closed-maps)]
    (if-let [explanation (binding [db-malli-schema/*db-for-validate-fns* db]
                           (->> (map (fn [e] (dissoc e :db/id)) ent-maps) explainer not-empty))]
      (do
        (if group-errors
          (let [ent-errors (db-validate/group-errors-by-entity db ent-maps (:errors explanation))]
            (println "Found" (count ent-errors) "entities in errors:")
            (cond
              verbose
              (pprint/pprint ent-errors)
              humanize
              (pprint/pprint (map #(-> (dissoc % :errors-by-type)
                                       (update :errors (fn [errs] (me/humanize {:errors errs}))))
                                  ent-errors))
              :else
              (pprint/pprint (map :entity ent-errors))))
          (let [errors (:errors explanation)]
            (println "Found" (count errors) "errors:")
            (cond
              verbose
              (pprint/pprint
               (map #(assoc %
                            :entity (get ent-maps (-> % :in first))
                            :schema (m/form (:schema %)))
                    errors))
              humanize
              (pprint/pprint (me/humanize {:errors errors}))
              :else
              (pprint/pprint errors))))
        (js/process.exit 1))
      (println "Valid!"))))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :humanize {:alias :H
              :default true
              :desc "Humanize errors as an alternative to -v"}
   :verbose {:alias :v
             :desc "Print more info"}
   :closed-maps {:alias :c
                 :default true
                 :desc "Validate maps marked with closed as :closed"}
   :group-errors {:alias :g
                  :default true
                  :desc "Groups errors by their entity id"}})

(defn- validate-graph [graph-dir options]
  (let [[dir db-name] (if (string/includes? graph-dir "/")
                        (let [graph-dir'
                              (node-path/join (or js/process.env.ORIGINAL_PWD ".") graph-dir)]
                          ((juxt node-path/dirname node-path/basename) graph-dir'))
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (try (sqlite-cli/open-db! dir db-name)
                  (catch :default e
                    (println "Error: For graph" (str (pr-str graph-dir) ":") (str e))
                    (js/process.exit 1)))
        datoms (d/datoms @conn :eavt)
        ent-maps (db-malli-schema/datoms->entities datoms)]
    (println "Read graph" (str db-name " with counts: "
                               (pr-str (assoc (db-validate/graph-counts @conn ent-maps)
                                              :datoms (count datoms)))))
    (validate-client-db @conn ent-maps options)))

(defn -main [argv]
  (let [{:keys [args opts]} (cli/parse-args argv {:spec spec})
        _ (when (or (empty? args) (:help opts))
            (println (str "Usage: $0 GRAPH-NAME [& ADDITIONAL-GRAPHS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))]
    (doseq [graph-dir args]
      (validate-graph graph-dir opts))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
