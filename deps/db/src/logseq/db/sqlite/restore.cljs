(ns logseq.db.sqlite.restore
  "Fns to restore data from a sqlite database to a datascript one"
  (:require [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]))

(defn restore-initial-data
  "Given initial sqlite data, returns a datascript connection"
  [datoms]
  (d/conn-from-datoms datoms db-schema/schema-for-db-based-graph))