(ns logseq.tasks.malli
  "Malli related tasks"
  (:require [malli.core :as m]
            [malli.error :as me]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
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
