(ns frontend.date
  (:require [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-time.format :as tf]
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
     "yyyy年MM月dd日"}
   (state/get-date-formatter)))

(defn get-date-time-string [date-time]
  (tf/unparse custom-formatter date-time))

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
   (journal-name (t/now)))
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
  (journal-name (t/yesterday)))

(defn get-month-last-day
  []
  (let [today (js/Date.)
        date (js/Date. (.getFullYear today) (inc (.getMonth today)) 0)]
    (.getDate date)))

(defn ymd
  ([]
   (ymd (js/Date.)))
  ([date]
   (let [{:keys [year month day]} (year-month-day-padded (get-date date))]
     (str year "/" month "/" day))))

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
  (let [{:keys [year month]} (get-date)]
    (journals-path year month preferred-format)))

(defn valid?
  [s]
  (some
   (fn [formatter]
     (try
       (tf/parse (tf/formatter formatter) s)
       (catch js/Error _e
         false)))
   (journal-title-formatters)))

(defn journal-title->int
  [journal-title]
  (when-not (string/blank? journal-title)
    (let [time (->> (map
                      (fn [formatter]
                        (try
                          (tf/parse (tf/formatter formatter) journal-title)
                          (catch js/Error _e
                            nil)))
                      (journal-title-formatters))
                    (filter some?)
                    first)]
      (util/parse-int (tf/unparse (tf/formatter "yyyyMMdd") time)))))

(comment
  (def default-formatter (tf/formatter "MMM do, yyyy"))
  (def zh-formatter (tf/formatter "YYYY年MM月dd日"))

  (tf/show-formatters)

  ;; :date 2020-05-31
  ;; :rfc822 Sun, 31 May 2020 03:00:57 Z
  )
