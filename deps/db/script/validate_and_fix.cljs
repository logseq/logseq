(ns validate-and-fix
  "Validate a DB graph and run frontend.worker.db.validate-fix repairs."
  (:require [babashka.cli :as cli]
            [clojure.pprint :as pprint]
            [frontend.worker.db.validate-fix :as validate-fix]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [nbb.core :as nbb]))

(def spec
  {:help {:alias :h
          :desc "Print help"}
   :no-fix {:desc "Only validate; do not run invalid data repairs"}
   :verbose {:alias :v
             :desc "Print invalid entity ids and final summary"}})

(defn- usage []
  (str "Usage: bb dev:validate-and-fix GRAPH [OPTIONS]\n\n"
       "GRAPH can be a DB graph name or a sqlite file path, e.g. ~/Downloads/db.sqlite.\n\n"
       "Options:\n"
       (cli/format-opts {:spec spec})))

(defn- expand-home
  [path]
  (if (.startsWith path "~/")
    (str js/process.env.HOME (.slice path 1))
    path))

(defn- print-result!
  [graph {:keys [errors datom-count invalid-entity-ids]} options]
  (if (seq errors)
    (do
      (println "Graph" (pr-str graph) "is still invalid.")
      (println "Found" (count errors)
               (if (= 1 (count errors)) "entity" "entities")
               "with errors.")
      (when (:verbose options)
        (println "Invalid entity ids:")
        (pprint/pprint invalid-entity-ids)
        (println "Errors:")
        (pprint/pprint errors))
      (js/process.exit 1))
    (do
      (println "Valid!")
      (when (:verbose options)
        (println "Datoms:" datom-count)))))

(defn- open-graph!
  [graph]
  (apply sqlite-cli/open-sqlite-datascript! (sqlite-cli/->open-db-args graph)))

(defn- close-sqlite!
  [sqlite]
  (when sqlite
    (.close sqlite)))

(defn- validate-open-graph!
  [graph options]
  (let [{:keys [sqlite conn]} (open-graph! graph)]
    (try
      (if (:no-fix options)
        (let [{:keys [errors] :as result} (validate-fix/validate-db-result @conn)]
          (validate-fix/log-validation-errors! errors)
          result)
        (validate-fix/validate-and-fix-invalid-blocks! conn))
      (finally
        (close-sqlite! sqlite)))))

(defn validate-and-fix-graph!
  [graph options]
  (print-result! graph
                 (validate-open-graph! (expand-home graph) options)
                 options))

(defn -main
  [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        graph (first args')]
    (when (or (:help options) (nil? graph))
      (println (usage))
      (js/process.exit (if (:help options) 0 1)))
    (validate-and-fix-graph! graph options)))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
