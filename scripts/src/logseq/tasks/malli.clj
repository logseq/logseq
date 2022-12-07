(ns logseq.tasks.malli
  "Malli related tasks"
  (:require [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            [frontend.schema.handler.global-config :as global-config-schema]
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

;; This fn should be split if the global and repo definitions diverge
(defn validate-config-edn
  "Validate a global or repo config.edn file"
  [file]
  (if-let [errors (->> file
                       slurp
                       edn/read-string
                       (m/explain global-config-schema/Config-edn)
                       me/humanize)]
    (do
      (println "Found errors:")
      (pprint/pprint errors))
    (println "Valid!")))
