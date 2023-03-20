(ns logseq.tasks.malli
  "Malli related tasks"
  (:require [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [logseq.graph-parser.schema.mldoc :as mldoc-schema]
            [babashka.fs :as fs]
            [clojure.pprint :as pprint]
            [clojure.edn :as edn]))

(defn validate-plugins-edn
  "Validate a plugins.edn file"
  [file]
  (if-let [errors (->> file
                       slurp
                       edn/read-string
                       (m/explain plugin-config-schema/Plugins-edn)
                       me/humanize)]
    (do
      (println "Found errors:")
      (pprint/pprint errors))
    (println "Valid!")))

(defn- validate-file-with-schema
  "Validate a file given its schema"
  [file schema]
  (if-let [errors (->> file
                       slurp
                       edn/read-string
                       (m/explain schema)
                       me/humanize)]
    (do
      (println "Found errors:")
      (pprint/pprint errors))
    (println "Valid!")))

(defn validate-repo-config-edn
  "Validate a repo config.edn"
  [file]
  (validate-file-with-schema file global-config-schema/Config-edn))

(defn validate-global-config-edn
  "Validate a global config.edn"
  [file]
  (validate-file-with-schema file repo-config-schema/Config-edn))

(defn validate-ast
  "Validate mldoc ast(s) in a file or as an EDN arg"
  [file-or-edn]
  (let [edn (edn/read-string
             (if (fs/exists? file-or-edn) (slurp file-or-edn) file-or-edn))]
    (if (and (sequential? edn) (:ast (first edn)))
      ;; Validate multiple asts in the format [{:file "" :ast []} ...]
      ;; Produced by https://github.com/logseq/nbb-logseq/tree/main/examples/from-js#graph_astmjs
      (do
        (println "Validating" (count edn) "files...")
        (if-let [errors-by-file (seq (keep
                                      #(when-let [errors (m/explain mldoc-schema/block-ast-with-pos-coll-schema (:ast %))]
                                         {:file (:file %)
                                          :errors errors})
                                      edn))]
          (do
            (println "Found errors:")
            (pprint/pprint errors-by-file))
          (println "All files valid!")))
      (if-let [errors (m/explain mldoc-schema/block-ast-with-pos-coll-schema edn)]
        (do
          (println "Found errors:")
          (pprint/pprint errors))
        (println "Valid!")))))
