(ns validate-client-db
  "Script that validates the datascript db of a DB graph
   NOTE: This script is also used in CI to confirm our db's schema is up to date"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.frontend.property :as db-property]
            [datascript.core :as d]
            [clojure.string :as string]
            [nbb.core :as nbb]
            [malli.core :as m]
            [babashka.cli :as cli]
            ["path" :as node-path]
            ["os" :as os]
            [cljs.pprint :as pprint]))

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [db ent-maps* {:keys [verbose group-errors closed-maps]}]
  (let [ent-maps ent-maps*
        ;; TODO: Fix
        ;; ent-maps (db-malli-schema/update-properties-in-ents ent-maps*)
        schema (db-validate/update-schema db-malli-schema/DB db {:closed-schema? closed-maps})]
    (if-let [errors (->> ent-maps
                         (m/explain schema)
                         :errors)]
      (do
        (if group-errors
          (let [ent-errors (db-validate/group-errors-by-entity db ent-maps errors)]
            (println "Found" (count ent-errors) "entities in errors:")
            (if verbose
              (pprint/pprint ent-errors)
              (pprint/pprint (map :entity ent-errors))))
          (do
            (println "Found" (count errors) "errors:")
            (if verbose
              (pprint/pprint
               (map #(assoc %
                            :entity (get ent-maps (-> % :in first))
                            :schema (m/form (:schema %)))
                    errors))
              (pprint/pprint errors))))
        (js/process.exit 1))
      (println "Valid!"))))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Print more info"}
   :closed-maps {:alias :c
                 :desc "Validate maps marked with closed as :closed"}
   :group-errors {:alias :g
                  :desc "Groups errors by their entity id"}})

(defn- validate-graph [graph-dir options]
  (let [[dir db-name] (if (string/includes? graph-dir "/")
                        (let [graph-dir'
                              (node-path/join (or js/process.env.ORIGINAL_PWD ".") graph-dir)]
                          ((juxt node-path/dirname node-path/basename) graph-dir'))
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (try (sqlite-db/open-db! dir db-name)
                  (catch :default e
                    (println "Error: For graph" (str (pr-str graph-dir) ":") (str e))
                    (js/process.exit 1)))
        datoms (d/datoms @conn :eavt)
        ent-maps (db-malli-schema/datoms->entities datoms)]
    (println "Read graph" (str db-name " with " (count datoms) " datoms, "
                               (count ent-maps) " entities, "
                               (count (filter :block/name ent-maps)) " pages, "
                               (count (filter :block/content ent-maps)) " blocks, "
                               (count (filter #(contains? (:block/type %) "class") ent-maps)) " classes, "
                               (count (filter #(seq (:block/tags %)) ent-maps)) " objects, "
                               (count (filter #(contains? (:block/type %) "property") ent-maps)) " properties and "
                               (count (filter :property/pair-property ent-maps)) " property pairs"))
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