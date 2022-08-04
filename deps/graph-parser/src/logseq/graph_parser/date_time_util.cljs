(ns logseq.graph-parser.date-time-util
  "cljs-time util fns for graph-parser"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]))

(defn time-ms
  "Copy of util/time-ms. Too basic to couple this to main app"
  []
  (tc/to-long (t/now)))

;; (tf/parse (tf/formatter "dd.MM.yyyy") "2021Q4") => 20040120T000000
(defn safe-journal-title-formatters
  [date-formatter]
  (->> [date-formatter "MMM do, yyyy" "yyyy-MM-dd" "yyyy_MM_dd"]
       (remove string/blank?)
       distinct))

(defn journal-title->
  [journal-title then-fn formatters]
  (when-not (string/blank? journal-title)
    (when-let [time (->> (map
                          (fn [formatter]
                            (try
                              (tf/parse (tf/formatter formatter) (gp-util/capitalize-all journal-title))
                              (catch :default _e
                                nil)))
                          formatters)
                         (filter some?)
                         first)]
      (then-fn time))))

(defn journal-title->int
  [journal-title formatters]
  (when journal-title
    (let [journal-title (gp-util/capitalize-all journal-title)]
      (journal-title-> journal-title
                       #(parse-long (tf/unparse (tf/formatter "yyyyMMdd") %))
                       formatters))))

(defn format
  [date date-formatter]
  (when date-formatter
    (tf/unparse (tf/formatter date-formatter) date)))

(defn int->journal-title
  [day date-formatter]
  (when day
    (format (tf/parse (tf/formatter "yyyyMMdd") (str day)) date-formatter)))
