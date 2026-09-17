(ns logseq.common.util.date-time
  "cljs-time util fns for deps"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [clojure.string :as string]
            [logseq.common.util :as common-util]))

(def ^:private yyyyMMdd-formatter (tf/formatter "yyyyMMdd"))
(def ^:api default-journal-title-formatter "MMM do, yyyy")
(def ^:private default-journal-title-formatter*
  (tf/formatter default-journal-title-formatter))

;; (tf/parse (tf/formatter "dd.MM.yyyy") "2021Q4") => 20040120T000000
(defn safe-journal-title-formatters
  [date-formatter]
  (->> [date-formatter default-journal-title-formatter "yyyy-MM-dd" "yyyy_MM_dd"]
       (remove string/blank?)
       distinct))

(defn journal-title->
  [journal-title then-fn formatters]
  (when-not (string/blank? journal-title)
    (when-let [time' (->> (map
                           (fn [formatter]
                             (try
                               (tf/parse (tf/formatter formatter) (common-util/capitalize-all journal-title))
                               (catch :default _e
                                 nil)))
                           formatters)
                          (filter some?)
                          first)]
      (then-fn time'))))

(defn journal-title->int
  [journal-title formatters]
  (when journal-title
    (let [journal-title (common-util/capitalize-all journal-title)]
      (journal-title-> journal-title
                       #(parse-long (tf/unparse yyyyMMdd-formatter %))
                       formatters))))

(defn format
  [date date-formatter]
  (when-not (string/blank? date-formatter)
    (tf/unparse (if (= date-formatter default-journal-title-formatter)
                  default-journal-title-formatter*
                  (tf/formatter date-formatter))
                date)))

(defn- invalid-journal-day!
  [day]
  (throw (ex-info "Invalid journal-day"
                  {:type :invalid-journal-day
                   :journal-day day})))

(defn- journal-day-components
  "Parse a yyyymmdd journal-day integer into calendar parts.
   Throws on a non-nil value that is not a real calendar day."
  [day]
  (when (some? day)
    (when-not (or (int? day)
                  (and (number? day) (zero? (mod day 1))))
      (invalid-journal-day! day))
    (let [s (str (long day))]
      (when-not (re-matches #"\d{8}" s)
        (invalid-journal-day! day))
      (let [year (js/parseInt (subs s 0 4) 10)
            month (js/parseInt (subs s 4 6) 10)
            date (js/parseInt (subs s 6) 10)
            local-date (t/local-date year month date)]
        (when (or (not= year (t/year local-date))
                  (not= month (t/month local-date))
                  (not= date (t/day local-date)))
          (invalid-journal-day! day))
        {:year year
         :month month
         :day date
         :local-date local-date}))))

(defn int->local-date
  "Local midnight js/Date for a journal-day integer.
   Same Y/M/D encoding as the date picker (goog.date.Date from local components)."
  [day]
  (when-let [{:keys [year month day]} (journal-day-components day)]
    (js/Date. year (dec month) day)))

(defn int->journal-title
  "Format a journal-day integer with the given title formatter.

   Uses a local goog.date.Date so UTC-offset hosts (typical Windows) keep the
   same calendar day the date picker stored. Invalid journal-day values throw
   instead of rendering a blank title."
  [day date-formatter]
  (when day
    (let [formatter (or (not-empty date-formatter) default-journal-title-formatter)
          title (format (:local-date (journal-day-components day)) formatter)]
      (when (string/blank? title)
        (invalid-journal-day! day))
      title)))

(defn journal-page-display-title
  "Visible title for a page map. Journal pages with a blank stored title fall
   back to :block/journal-day so date refs cannot render as [[]]."
  ([page]
   (journal-page-display-title page default-journal-title-formatter))
  ([page date-formatter]
   (let [title (:block/title page)]
     (if (not (string/blank? title))
       title
       (when-let [day (:block/journal-day page)]
         (int->journal-title day date-formatter))))))

(defn with-journal-display-title
  "Assoc a derived journal title when the stored title is blank."
  ([page]
   (with-journal-display-title page default-journal-title-formatter))
  ([page date-formatter]
   (if (map? page)
     (let [title (journal-page-display-title page date-formatter)]
       (cond-> page
         (and (string/blank? (:block/title page))
              (not (string/blank? title)))
         (assoc :block/title title)))
     page)))

(defn- get-weekday
  [date]
  (.toLocaleString date "en-us" (clj->js {:weekday "long"})))

(defn- get-date
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
      :month (common-util/zero-pad month)
      :day (common-util/zero-pad day)})))

(defn ymd
  ([]
   (ymd (js/Date.)))
  ([date]
   (ymd date "/"))
  ([date sep]
   (let [{:keys [year month day]} (year-month-day-padded (get-date date))]
     (str year sep month sep day))))

(defn date->int
  "Given a date object, returns its journal page integer"
  [date]
  (parse-long
   (string/replace (ymd date) "/" "")))

(defn journal-day->ms
  "Converts a journal's :block/journal-day integer into milliseconds"
  [day]
  (when day
    (-> (tf/parse yyyyMMdd-formatter (str day))
        (tc/to-long))))

(defn ms->journal-day
  "Converts a milliseconds timestamp to the nearest :block/journal-day"
  [ms]
  (some->> ms
           tc/from-long
           t/to-default-time-zone
           (tf/unparse yyyyMMdd-formatter)
           parse-long))
