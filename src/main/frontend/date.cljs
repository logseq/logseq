(ns frontend.date
  "Date related utility fns"
  (:require ["chrono-node" :as chrono]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.state :as state]
            [frontend.util :as util]
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
     "dd.MM.yyyy"
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
  [s]
  (try
    (->> (tf/parse (tf/formatters :date-time-no-ms) s)
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

(defn get-weekday
  [date]
  (.toLocaleString date "en-us" (clj->js {:weekday "long"})))

(defn get-date
  ([]
   (get-date (js/Date.)))
  ([date]
   {:year (.getFullYear date)
    :month (inc (.getMonth date))
    :day (.getDate date)
    :weekday (get-weekday date)}))

(defn year-month-day-padded
  ([]
   (year-month-day-padded (get-date)))
  ([date]
   (let [{:keys [year month day]} date]
     {:year year
      :month (util/zero-pad month)
      :day (util/zero-pad day)})))

(defn journal-name
  ([]
   (journal-name (tl/local-now)))
  ([date]
   (date-time-util/format date (state/get-date-formatter))))

(defn journal-name-s [s]
  (try
    (journal-name (tf/parse (tf/formatter "yyyy-MM-dd") s))
    (catch :default _e
      (log/info :parse-journal-date {:message  "Unable to parse date to journal name, skipping."
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

(defn ymd
  ([]
   (ymd (js/Date.)))
  ([date]
   (ymd date "/"))
  ([date sep]
   (let [{:keys [year month day]} (year-month-day-padded (get-date date))]
     (str year sep month sep day))))

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

(defn valid?
  [s]
  (some
   (fn [formatter]
     (try
       (tf/parse (tf/formatter formatter) s)
       (catch :default _e
         false)))
   (journal-title-formatters)))

(defn valid-journal-title?
  [title]
  (and title
       (valid? (gp-util/capitalize-all title))))

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

(comment
  (def default-formatter (tf/formatter "MMM do, yyyy"))
  (def zh-formatter (tf/formatter "YYYY年MM月dd日"))

  (tf/show-formatters)

  ;; :date 2020-05-31
  ;; :rfc822 Sun, 31 May 2020 03:00:57 Z
)
