(ns frontend.date
  "Journal date related utility fns"
  (:require ["chrono-node" :as chrono]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.state :as state]
            [logseq.common.util.date-time :as date-time-util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [frontend.common.date :as common-date]))

(defn nld-parse
  [s]
  (when (string? s)
    ((gobj/get chrono "parseDate") s)))

(def custom-formatter (tf/formatter "yyyy-MM-dd'T'HH:mm:ssZZ"))

(defn journal-title-formatters
  []
  (common-date/journal-title-formatters (state/get-date-formatter)))

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
  [s]
  (common-date/normalize-date s (state/get-date-formatter)))

(defn normalize-journal-title
  [title]
  (common-date/normalize-journal-title title (state/get-date-formatter)))

(defn valid-journal-title?
  [title]
  (common-date/valid-journal-title? title (state/get-date-formatter)))

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
  "journal-day format yyyyMMdd"
  [day]
  (when day
    (-> (tf/parse (tf/formatter "yyyyMMdd") (str day))
        (tc/to-long))))

(defn journal-title->long
  [journal-title]
  (journal-title-> journal-title #(tc/to-long %)))

(def default-journal-filename-formatter common-date/default-journal-filename-formatter)

(defn journal-title->default
  "Journal title to filename format"
  [journal-title]
  (let [formatter (if-let [format (state/get-journal-file-name-format)]
                    (tf/formatter format)
                    (tf/formatter default-journal-filename-formatter))]
    (journal-title-> journal-title #(tf/unparse formatter %))))

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

(defn js-date->journal-title
  [date]
  (journal-name (tc/to-local-date date)))

(defn js-date->goog-date
  [d]
  (cond
    (some->> d (instance? js/Date))
    (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
    :else d))

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
