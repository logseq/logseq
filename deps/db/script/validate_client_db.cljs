(ns validate-client-db
  "Script that validates the datascript db of a DB graph"
  (:require [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.schema :as db-schema]
            [logseq.db.malli-schema :as db-malli-schema]
            [datascript.core :as d]
            [clojure.string :as string]
            [nbb.core :as nbb]
            [clojure.walk :as walk]
            [malli.core :as m]
            [babashka.cli :as cli]
            ["path" :as node-path]
            ["os" :as os]
            [cljs.pprint :as pprint]))

(defn- build-grouped-errors [db full-maps errors]
  (->> errors
       (group-by #(-> % :in first))
       (map (fn [[idx errors']]
              {:entity (cond-> (get full-maps idx)
                         ;; Provide additional page info for debugging
                         (:block/page (get full-maps idx))
                         (update :block/page
                                 (fn [id] (select-keys (d/entity db id)
                                                       [:block/name :block/type :db/id :block/created-at]))))
               ;; Group by type to reduce verbosity
               :errors-by-type
               (->> (group-by :type errors')
                    (map (fn [[type' type-errors]]
                           [type'
                            {:in-value-distinct (->> type-errors
                                                     (map #(select-keys % [:in :value]))
                                                     distinct
                                                     vec)
                             :schema-distinct (->> (map :schema type-errors)
                                                   (map m/form)
                                                   distinct
                                                   vec)}]))
                    (into {}))}))))

(defn- update-schema
  "Updates the db schema to add a datascript db for property validations
   and to optionally close maps"
  [db-schema db {:keys [closed-maps]}]
  (let [db-schema-with-property-vals (db-malli-schema/update-properties-in-schema db-schema db)]
    (if closed-maps
      ;; closes maps that don't have an explicit :closed option
      (walk/postwalk (fn [e]
                       (if (and (vector? e)
                                (= :map (first e)))
                         (if (map? (second e))
                           (if (not (contains? (second e) :closed))
                             (assoc e 1 (assoc (second e) :closed true))
                             e)
                           (into [:map {:closed true}] (rest e)))
                         e))
                     db-schema-with-property-vals)
      db-schema-with-property-vals)))

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [db ent-maps* {:keys [verbose group-errors] :as options}]
  (let [ent-maps (vec (db-malli-schema/update-properties-in-ents (vals ent-maps*)))
        schema (update-schema db-malli-schema/DB db options)]
    (if-let [errors (->> ent-maps
                         (m/explain schema)
                         :errors)]
      (do
        (if group-errors
          (let [ent-errors (build-grouped-errors db ent-maps errors)]
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

(defn- datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (if (contains? db-schema/card-many-attributes (:a m))
                   (update acc (:e m) update (:a m) (fnil conj #{}) (:v m))
                   (update acc (:e m) assoc (:a m) (:v m))))
               {})))

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
        _ (try (sqlite-db/open-db! dir db-name)
               (catch :default e
                 (println "Error: For graph" (str (pr-str graph-dir) ":") (str e))
                 (js/process.exit 1)))
        conn (sqlite-cli/read-graph db-name)
        datoms (d/datoms @conn :eavt)
        ent-maps (datoms->entity-maps datoms)]
    (println "Read graph" (str db-name " with " (count datoms) " datoms, "
                               (count ent-maps) " entities and "
                               (count (mapcat :block/properties (vals ent-maps))) " properties"))
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