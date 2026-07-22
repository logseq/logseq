(ns export-db-rules
  "Export the Melange-owned Datalog rules for the Babashka linter."
  (:require [logseq.melange.bridge.db.rules :as rules]))

(def ^:private lint-excluded-rule-names
  [:task
   :priority
   :property
   :simple-query-property
   :private-property
   :property-scalar-default-value
   :property-missing-value
   :has-property-or-object-property])

(defn -main
  []
  (prn
   {:rules rules/rules
    :lint-db-query-rules
    (rules/extract-rules
     (apply dissoc rules/db-query-dsl-rules lint-excluded-rule-names))}))
