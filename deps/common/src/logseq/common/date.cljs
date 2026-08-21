(ns logseq.common.date
  "Date related fns shared by worker and frontend namespaces. Eventually some
   of this should go to logseq.common.util.date-time"
  (:require [cljs-time.format :as tf]
            [clojure.string :as string]
            [logseq.common.util :as common-util]))

(defonce built-in-journal-title-formatters
  (list
   "do MMM yyyy"
   "do MMMM yyyy"
   "MMM do, yyyy"
   "MMMM do, yyyy"
   "E, dd-MM-yyyy"
   "E, dd.MM.yyyy"
   "E, MM/dd/yyyy"
   "E, yyyy/MM/dd"
   "EEE, dd-MM-yyyy"
   "EEE, dd.MM.yyyy"
   "EEE, MM/dd/yyyy"
   "EEE, yyyy/MM/dd"
   "EEEE, dd-MM-yyyy"
   "EEEE, dd.MM.yyyy"
   "EEEE, MM/dd/yyyy"
   "EEEE, yyyy/MM/dd"
   "dd-MM-yyyy"
     ;; This tyle will mess up other date formats like "2022-08" "2022Q4" "2022/10"
     ;;  "dd.MM.yyyy"
   "MM/dd/yyyy"
   "MM-dd-yyyy"
   "MM_dd_yyyy"
   "yyyy/MM/dd"
   "yyyy-MM-dd"
   "yyyy-MM-dd EEE"
   "yyyy-MM-dd EEEE"
   "yyyy_MM_dd"
   "yyyyMMdd"
   "yyyy年MM月dd日"))

(defonce slash-journal-title-formatters
  (filter #(string/includes? % "/") built-in-journal-title-formatters))

(defonce ^:private slash-journal-title-parser-by-shape
  {[false false] (tf/formatter "MM/dd/yyyy")
   [false true] (tf/formatter "yyyy/MM/dd")
   [true false] (tf/formatter "E, MM/dd/yyyy")
   [true true] (tf/formatter "E, yyyy/MM/dd")})

(defn journal-title-formatters
  [date-formatter]
  (->
   (cons
    date-formatter
    built-in-journal-title-formatters)
   (distinct)))

(defn normalize-date
  "Parses raw date string `s` using the configured and built-in journal formats."
  [s date-formatter]
  (some
   (fn [formatter]
     (try
       (tf/parse (tf/formatter formatter) s)
       (catch :default _e
         false)))
   (journal-title-formatters date-formatter)))

(defn normalize-journal-title
  "Normalize journal title at best effort. Return nil if title is not a valid date.
   Return goog.date.Date.

   Return format: 20220812T000000"
  [title date-formatter]
  (and title
       (normalize-date (common-util/capitalize-all title) date-formatter)))

(defn ^:api valid-journal-title?
  "This is a loose rule, requires double check by journal-title->custom-format.

   BUG: This also accepts strings like 3/4/5 as journal titles"
  [title date-formatter]
  (boolean (normalize-journal-title title date-formatter)))

(defn ^:api valid-journal-title-with-slash?
  [title]
  (when title
    (let [title (common-util/capitalize-all title)
          weekday-prefix? (string/includes? title ", ")
          date-title (if weekday-prefix?
                       (subs title (+ 2 (string/index-of title ", ")))
                       title)
          year-first? (= 4 (string/index-of date-title "/"))
          formatter (get slash-journal-title-parser-by-shape
                         [weekday-prefix? year-first?])]
      (try
        (boolean (tf/parse formatter title))
        (catch :default _e
          false)))))
