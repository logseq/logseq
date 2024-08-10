(ns logseq.db.frontend.entity-util
  "Lower level entity util fns used across db namespaces"
  (:require [datascript.core :as d]))

(defn db-based-graph?
  "Whether the current graph is db-only"
  [db]
  (when db
    (= "db" (:kv/value (d/entity db :logseq.kv/db-type)))))
