(ns logseq.tasks.db-graph.validate-client-db
  "Script that validates the datascript db of a db graph.
   Currently only validates :block/schema but it will validate much more ..."
  (:require [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
            [datascript.core :as d]
            [clojure.string :as string]
            [nbb.core :as nbb]
            [clojure.pprint :as pprint]
            [malli.core :as m]
            ["path" :as node-path]
            ["os" :as os]))

(def client-db-schema
  [:sequential
   [:map
    [:block/schema
     {:optional true}
     [:map
      ;; TODO: only validate most of these for property blocks
      [:type {:optional true} :keyword]
      [:cardinality {:optional true} [:enum :one :many]]
      [:classes {:optional true} [:set :uuid]]
      [:description {:optional true} :string]
      ;; TODO: require this for class blocks
      [:properties {:optional true} [:vector :uuid]]]]]])

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [ent-maps]
  (if-let [errors (->> ent-maps
                       (m/explain client-db-schema)
                       :errors)]
    (do
      (println "Found" (count errors) "errors:")
      (pprint/pprint errors)
      (js/process.exit 1))
    (println "Valid!")))

(defn- datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (update acc (:e m) assoc (:a m) (:v m)))
               {})
       vals))

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [graph-dir (first args)
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        _ (sqlite-db/open-db! dir db-name)
        conn (sqlite-cli/read-graph db-name)
        datoms (d/datoms @conn :eavt)
        ent-maps (datoms->entity-maps datoms)]
    (println "Read graph" (str db-name " with " (count datoms) " datoms!"))
    (validate-client-db ent-maps)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))