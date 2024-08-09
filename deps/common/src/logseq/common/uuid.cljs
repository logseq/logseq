(ns logseq.common.uuid
  "uuid generators"
  (:require [datascript.core :as d]))

(defn- gen-journal-page-uuid
  "00000001-2024-0620-0000-000000000000
first 8 chars as type, currently only '00000001' for journal-day-page.
the remaining chars for data of this type"
  [journal-day]
  {:pre [(pos-int? journal-day)
         (> 1 (/ journal-day 100000000))]}
  (let [journal-day-str  (str journal-day)
        part1 (subs journal-day-str 0 4)
        part2 (subs journal-day-str 4 8)]
    (uuid (str "00000001-" part1 "-" part2 "-0000-000000000000"))))

(defn- fill-with-0
  [s length]
  (let [s-length (count s)]
    (apply str s (repeat (- length s-length) "0"))))

(defn- gen-db-ident-block-uuid
  "00000002-<hash-of-db-ident>-<padding-with-0>"
  [db-ident]
  {:pre [(keyword? db-ident)]}
  (let [hash-num (str (Math/abs (hash db-ident)))
        part1 (fill-with-0 (subs hash-num 0 4) 4)
        part2 (fill-with-0 (subs hash-num 4 8) 4)
        part3 (fill-with-0 (subs hash-num 8 12) 4)
        part4 (fill-with-0 (subs hash-num 12) 12)]
    (uuid (str "00000002-" part1 "-" part2 "-" part3 "-" part4))))

(defn gen-uuid
  "supported type:
  - :journal-page-uuid
  - :db-ident-block-uuid"
  ([] (d/squuid))
  ([type v]
   (case type
     :journal-page-uuid (gen-journal-page-uuid v)
     :db-ident-block-uuid (gen-db-ident-block-uuid v))))
