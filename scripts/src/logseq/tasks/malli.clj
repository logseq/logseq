(ns logseq.tasks.malli
  "Malli related tasks"
  (:require [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.schema.handler.repo-config :as repo-config-schema]
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
