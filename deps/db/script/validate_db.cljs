(ns validate-db
  "Script that validates the datascript db of a DB graph
   NOTE: This script is also used in CI to confirm our db's schema is up to date"
  (:require [babashka.cli :as cli]
            [cljs.pprint :as pprint]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.validate :as db-validate]
            [malli.core :as m]
            [malli.error :as me]
            [nbb.core :as nbb]))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}})

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

(defn- validate-graph [graph-dir options]
  (let [open-db-args (sqlite-cli/->open-db-args graph-dir)
        db-name (if (= 1 (count open-db-args)) (first open-db-args) (second open-db-args))
        conn (try (apply sqlite-cli/open-db! open-db-args)
                  (catch :default e
                    (println "Error: For graph" (str (pr-str graph-dir) ":") (str e))
                    (js/process.exit 1)))]
    (validate-db @conn db-name options)))

(defn -main [argv]
  (let [{:keys [args opts]} (cli/parse-args argv {:spec spec})
        _ (when (or (empty? args) (:help opts))
            (println (str "Usage: $0 GRAPH-NAME [& ADDITIONAL-GRAPHS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))]
    (doseq [graph-dir args]
      (validate-graph graph-dir opts))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
