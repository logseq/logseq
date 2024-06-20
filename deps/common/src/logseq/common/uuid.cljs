(ns logseq.common.uuid
  "uuid generators"
  (:require [datascript.core :as d]))

(defn- gen-journal-page-uuid
  "00000001-2024-0620-0000-000000000000
first 8 chars as type, currently only '00000001' for journal-day-page.
the remaining chars for data of this type"
  [journal-day]
  {:pre [(int? journal-day)]}
  (let [journal-day-str  (str journal-day)
        part1 (subs journal-day-str 0 4)
        part2 (subs journal-day-str 4 8)]
    (uuid (str "00000001-" part1 "-" part2 "-0000-000000000000"))))

(defn gen-uuid
  ([] (d/squuid))
  ([journal-day] (gen-journal-page-uuid journal-day)))
