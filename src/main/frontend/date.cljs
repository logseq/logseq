(ns frontend.date
  (:require [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.util :as util]
            [clojure.string :as string]
            [goog.object :as gobj]))

(defn format
  [date]
  (when-let [formatter-string (state/get-date-formatter)]
    (tf/unparse (tf/formatter formatter-string) date)))

(def custom-formatter (tf/formatter "yyyy-MM-dd HH:mm:ssZ"))

(defn journal-title-formatters
  []
  (conj
   #{"MMM do, yyyy"
     "MMMM do, yyyy"
     "E, MM/dd/yyyy"
     "E, yyyy/MM/dd"
     "EEE, MM/dd/yyyy"
     "EEE, yyyy/MM/dd"
     "EEEE, MM/dd/yyyy"
     "EEEE, yyyy/MM/dd"
     "MM/dd/yyyy"
     "MM-dd-yyyy"
     "MM_dd_yyyy"
     "yyyy/MM/dd"
     "yyyy-MM-dd"
     "yyyy_MM_dd"
     "yyyyMMdd"
     "yyyy年MM月dd日"}
   (state/get-date-formatter)))

(defn get-date-time-string [date-time]
  (tf/unparse custom-formatter date-time))

(defn get-local-date-time-string
  []
  (get-date-time-string (tl/local-now)))

(def custom-formatter-2 (tf/formatter "yyyy-MM-dd-HH-mm-ss"))

(defn get-date-time-string-2 []
  (tf/unparse custom-formatter-2 (tl/local-now)))

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
   (format date)))

(defn today
  []
  (journal-name))

(defn tomorrow
  []
  (journal-name (t/plus (t/today) (t/days 1))))

(defn yesterday
  []
  (journal-name (t/minus (t/today) (t/days 1))))

(defn get-month-last-day
  []
  (let [today (js/Date.)
        date (js/Date. (.getFullYear today) (inc (.getMonth today)) 0)]
    (.getDate date)))

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
                 :hour12 false}))))

(defn journals-path
  [year month preferred-format]
  (let [month (if (< month 10) (str "0" month) month)
        format (string/lower-case (name preferred-format))
        format (if (= format "markdown") "md" format)]
    (str "journals/" year "_" month "." format)))

(defn current-journal-path
  [preferred-format]
  (when preferred-format
    (let [{:keys [year month]} (get-date)
          preferred-format preferred-format]
      (journals-path year month preferred-format))))

(defn valid?
  [s]
  (some
   (fn [formatter]
     (try
       (tf/parse (tf/formatter formatter) s)
       (catch js/Error _e
         false)))
   (journal-title-formatters)))

(defn valid-journal-title?
  [title]
  (and title
       (valid? (string/capitalize title))))

(defn journal-title->
  [journal-title then-fn]
  (when-not (string/blank? journal-title)
    (when-let [time (->> (map
                          (fn [formatter]
                            (try
                              (tf/parse (tf/formatter formatter) journal-title)
                              (catch js/Error _e
                                nil)))
                          (journal-title-formatters))
                         (filter some?)
                         first)]
      (then-fn time))))

(defn journal-title->int
  [journal-title]
  (journal-title-> journal-title #(util/parse-int (tf/unparse (tf/formatter "yyyyMMdd") %))))

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

(defn journal-title->custom-format
  [journal-title]
  (journal-title-> journal-title format))

(defn int->local-time
  [n]
  (get-date-time-string (t/to-default-time-zone (tc/from-long n))))

(comment
  (def default-formatter (tf/formatter "MMM do, yyyy"))
  (def zh-formatter (tf/formatter "YYYY年MM月dd日"))

  (tf/show-formatters)

  ;; :date 2020-05-31
  ;; :rfc822 Sun, 31 May 2020 03:00:57 Z
)
