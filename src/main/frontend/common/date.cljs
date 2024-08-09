(ns frontend.common.date
  "Date related fns shared by worker and frontend namespaces. Eventually some
   of this should go to logseq.common.util.date-time"
  (:require [cljs-time.format :as tf]
            [logseq.common.util :as common-util]))

(def default-journal-filename-formatter "yyyy_MM_dd")

(defn journal-title-formatters
  [date-formatter]
  (->
   (cons
    date-formatter
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
     "yyyy-MM-dd EEEE"
     "yyyy_MM_dd"
     "yyyyMMdd"
     "yyyy年MM月dd日"))
   (distinct)))

(defn normalize-date
  "Given raw date string, return a normalized date string at best effort.
   Warning: this is a function with heavy cost (likely 50ms). Use with caution"
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

(defn valid-journal-title?
  "This is a loose rule, requires double check by journal-title->custom-format.

   BUG: This also accepts strings like 3/4/5 as journal titles"
  [title date-formatter]
  (boolean (normalize-journal-title title date-formatter)))

(defn date->file-name
  "Date object to filename format"
  [date journal-filename-formatter]
  (let [formatter (if journal-filename-formatter
                    (tf/formatter journal-filename-formatter)
                    (tf/formatter default-journal-filename-formatter))]
    (tf/unparse formatter date)))
