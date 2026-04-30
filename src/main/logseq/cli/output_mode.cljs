(ns logseq.cli.output-mode
  "Shared output mode utilities for CLI human/json/edn output handling."
  (:require [clojure.string :as string]))

(def allowed-keywords
  #{:human :json :edn})

(def allowed-values
  (into #{} (map name) allowed-keywords))

(def ^:private structured-keywords
  #{:json :edn})

(defn parse
  [value]
  (let [mode (cond
               (keyword? value) value
               (string? value) (some-> value string/trim string/lower-case keyword)
               :else nil)]
    (when (contains? allowed-keywords mode)
      mode)))

(defn string-value
  [value]
  (some-> (parse value) name))

(defn structured?
  [value]
  (contains? structured-keywords (parse value)))
