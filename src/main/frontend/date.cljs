(ns frontend.date
  "Date related utility fns"
  (:require ["chrono-node" :as chrono]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

(defn nld-parse
  [s]
  (when (string? s)
    ((gobj/get chrono "parseDate") s)))

(def custom-formatter (tf/formatter "yyyy-MM-dd'T'HH:mm:ssZZ"))

(defn journal-title-formatters
  []
  (->
   (cons
    (state/get-date-formatter)
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

(defn get-date-time-string
  ([]
   (get-date-time-string (t/now)))
  ([date-time]
   (tf/unparse custom-formatter date-time)))

(defn get-locale-string
  "Accepts a :date-time-no-ms string representation, or a cljs-time date object"
  [input]
  (try
    (->> (cond->> input
          (string? input) (tf/parse (tf/formatters :date-time-no-ms)))
         (t/to-default-time-zone)
         (tf/unparse (tf/formatter "MMM do, yyyy")))
    (catch :default _e
      nil)))

(def custom-formatter-2 (tf/formatter "yyyy-MM-dd-HH-mm-ss"))
(defn get-date-time-string-2 []
  (tf/unparse custom-formatter-2 (tl/local-now)))

(def custom-formatter-3 (tf/formatter "yyyy-MM-dd E HH:mm"))
(defn get-date-time-string-3 []
  (tf/unparse custom-formatter-3 (tl/local-now)))

(def custom-formatter-4 (tf/formatter "yyyy-MM-dd E HH:mm:ss"))
(defn get-date-time-string-4 []
  (tf/unparse custom-formatter-4 (tl/local-now)))

(defn journal-name
  ([]
   (journal-name (tl/local-now)))
  ([date]
   (let [formatter (state/get-date-formatter)]
     (try
      (date-time-util/format date formatter)
      (catch :default e
        (log/error :parse-journal-date {:message  "Failed to parse date to journal name."
                                        :date date
                                        :format formatter})
        (throw e))))))

(defn journal-name-s [s]
  (try
    (journal-name (tf/parse (tf/formatter "yyyy-MM-dd") s))
    (catch :default _e
      (log/error :parse-journal-date {:message  "Unable to parse date to journal name, skipping."
                                      :date-str s})
      nil)))

(defn today
  []
  (journal-name))

(defn tomorrow
  []
  (journal-name (t/plus (t/today) (t/days 1))))

(defn yesterday
  []
  (journal-name (t/minus (t/today) (t/days 1))))

(defn get-local-date
  []
  (let [date (js/Date.)
        year (.getFullYear date)
        month (inc (.getMonth date))
        day (.getDate date)
        hour (.getHours date)
        minute (.getMinutes date)]
    {:year year
     :month month
     :day day
     :hour hour
     :minute minute}))

(defn get-current-time
  []
  (let [d (js/Date.)]
    (.toLocaleTimeString
     d
     (gobj/get js/window.navigator "language")
     (bean/->js {:hour "2-digit"
                 :minute "2-digit"
                 :hourCycle "h23"}))))

(defn normalize-date
  "Given raw date string, return a normalized date string at best effort.
   Warning: this is a function with heavy cost (likely 50ms). Use with caution"
  [s]
  (some
   (fn [formatter]
     (try
       (tf/parse (tf/formatter formatter) s)
       (catch :default _e
         false)))
   (journal-title-formatters)))

(defn normalize-journal-title
  "Normalize journal title at best effort. Return nil if title is not a valid date"
  [title]
  (and title
       (normalize-date (gp-util/capitalize-all title))))

(defn valid-journal-title?
  [title]
  (boolean (normalize-journal-title title)))

(defn journal-title->
  ([journal-title then-fn]
   (journal-title-> journal-title then-fn (date-time-util/safe-journal-title-formatters (state/get-date-formatter))))
  ([journal-title then-fn formatters]
   (date-time-util/journal-title-> journal-title then-fn formatters)))

(defn journal-title->int
  [journal-title]
  (date-time-util/journal-title->int
   journal-title
   (date-time-util/safe-journal-title-formatters (state/get-date-formatter))))

(defn journal-day->ts
  [day]
  (when day
    (-> (tf/parse (tf/formatter "yyyyMMdd") (str day))
        (tc/to-long))))

(defn journal-title->long
  [journal-title]
  (journal-title-> journal-title #(tc/to-long %)))

(def default-journal-title-formatter (tf/formatter "yyyy_MM_dd"))

(defn journal-title->default
  [journal-title]
  (let [formatter (if-let [format (state/get-journal-file-name-format)]
                    (tf/formatter format)
                    default-journal-title-formatter)]
    (journal-title-> journal-title #(tf/unparse formatter %))))

(defn date->file-name
  [date]
  (let [formatter (if-let [format (state/get-journal-file-name-format)]
                    (tf/formatter format)
                    default-journal-title-formatter)]
    (tf/unparse formatter date)))

(defn journal-title->custom-format
  [journal-title]
  (journal-title-> journal-title #(date-time-util/format % (state/get-date-formatter))))

(defn int->local-time-2
  [n]
  (tf/unparse
   (tf/formatter "yyyy-MM-dd HH:mm")
   (t/to-default-time-zone (tc/from-long n))))

(def iso-parser (tf/formatter "yyyy-MM-dd'T'HH:mm:ss.SSSS'Z'"))
(defn parse-iso [string]
  (tf/parse iso-parser string))

(comment
  (def default-formatter (tf/formatter "MMM do, yyyy"))
  (def zh-formatter (tf/formatter "YYYY年MM月dd日"))

  (tf/show-formatters)

  ;; :date 2020-05-31
  ;; :rfc822 Sun, 31 May 2020 03:00:57 Z

  (let [info {:ExpireTime 1680781356,
              :UserGroups [],
              :LemonRenewsAt "2024-04-11T07:28:00.000000Z",
              :LemonEndsAt nil,
              :LemonStatus "active"}]
    (->> info :LemonRenewsAt (tf/parse iso-parser) (< (js/Date.))))) 
