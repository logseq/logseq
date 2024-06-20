(ns logseq.common.uuid
  "uuid generators"
  (:require [datascript.core :as d]))

(defn- gen-journal-page-uuid
  [journal-day]
  {:pre [(int? journal-day)]}
  (let [journal-day-str  (str journal-day)
        part1 (subs journal-day-str 0 4)
        part2 (subs journal-day-str 4 8)]
    (uuid (str "00000001-" part1 "-" part2 "-0000-000000000000"))))

(defn gen-uuid
  ([] (d/squuid))
  ([journal-day] (gen-journal-page-uuid journal-day)))
