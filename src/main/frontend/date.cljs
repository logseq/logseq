(ns frontend.date
  "Journal date related utility fns"
  (:require ["chrono-node" :as chrono]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.state :as state]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.date :as common-date]
            [logseq.common.util.date-time :as date-time-util]))

(defn nld-parse
  [s]
  (when (string? s)
    ((gobj/get chrono "parseDate") s)))

(def custom-formatter (tf/formatter "yyyy-MM-dd'T'HH:mm:ssZZ"))

(def ^:private mmm-do-yyyy-formatter (tf/formatter "MMM do, yyyy"))
(def ^:private yyyy-MM-dd-HH-mm-formatter (tf/formatter "yyyy-MM-dd HH:mm"))

(defn journal-title-formatters
  []
  (common-date/journal-title-formatters (state/get-date-formatter)))

(defn get-date-time-string
  ([]
   (get-date-time-string (t/now)))
  ([date-time & {:keys [formatter-str]}]
   (tf/unparse (if formatter-str
                 (tf/formatter formatter-str)
                 custom-formatter) date-time)))

(defn get-locale-string
  "Accepts a :date-time-no-ms string representation, or a cljs-time date object"
  [input]
  (try
    (->> (cond->> input
           (string? input) (tf/parse (tf/formatters :date-time-no-ms)))
         (t/to-default-time-zone)
         (tf/unparse mmm-do-yyyy-formatter))
    (catch :default _e
      nil)))

(def custom-formatter-2 (tf/formatter "yyyy-MM-dd-HH-mm-ss"))
(defn get-date-time-string-2 []
  (tf/unparse custom-formatter-2 (tl/local-now)))

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

(defn start-of-day [date]
  (t/date-time (t/year date) (t/month date) (t/day date)))

(defn today
  []
  (journal-name))

(defn tomorrow
  []
  (journal-name (t/plus (start-of-day (tl/local-now)) (t/days 1))))

(defn yesterday
  []
  (journal-name (t/minus (start-of-day (tl/local-now)) (t/days 1))))

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

(def journal-day->utc-ms date-time-util/journal-day->ms)

(defn journal-title->long
  [journal-title]
  (journal-title-> journal-title #(tc/to-long %)))

(def default-journal-filename-formatter common-date/default-journal-filename-formatter)

(defn int->local-time-2
  [n]
  (tf/unparse
   yyyy-MM-dd-HH-mm-formatter
   (t/to-default-time-zone (tc/from-long n))))

(def iso-parser (tf/formatter "yyyy-MM-dd'T'HH:mm:ss.SSSS'Z'"))
(defn parse-iso [string]
  (tf/parse iso-parser string))

(defn js-date->journal-title
  [date]
  (journal-name (t/to-default-time-zone date)))

(defn js-date->goog-date
  [d]
  (cond
    (some->> d (instance? js/Date))
    (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
    :else d))

(def nlp-pages
  ["Today"
   "Tomorrow"
   "Yesterday"
   "Next week"
   "This week"
   "Last week"
   "Next month"
   "This month"
   "Last month"
   "Next year"
   "This year"
   "Last year"
   "Last Monday"
   "Last Tuesday"
   "Last Wednesday"
   "Last Thursday"
   "Last Friday"
   "Last Saturday"
   "Last Sunday"
   "This Monday"
   "This Tuesday"
   "This Wednesday"
   "This Thursday"
   "This Friday"
   "This Saturday"
   "This Sunday"
   "Next Monday"
   "Next Tuesday"
   "Next Wednesday"
   "Next Thursday"
   "Next Friday"
   "Next Saturday"
   "Next Sunday"])

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
