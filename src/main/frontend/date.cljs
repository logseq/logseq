(ns frontend.date
  "Journal date related utility fns"
  (:require ["chrono-node" :as chrono]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.state :as state]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.date :as common-date]
            [logseq.common.util.date-time :as date-time-util]))

(def ^:private custom-formatter (tf/formatter "yyyy-MM-dd'T'HH:mm:ssZZ"))
(def ^:private custom-formatter-2 (tf/formatter "yyyy-MM-dd-HH-mm-ss"))
(def ^:private mmm-do-yyyy-formatter (tf/formatter "MMM do, yyyy"))
(def ^:private yyyy-MM-dd-HH-mm-formatter (tf/formatter "yyyy-MM-dd HH:mm"))
(def ^:private iso-parser (tf/formatter "yyyy-MM-dd'T'HH:mm:ss.SSSS'Z'"))

(defn nld-parse
  [s]
  (when (string? s)
    ((gobj/get chrono "parseDate") s)))

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

(defn get-date-time-string-2
  ([]
   (get-date-time-string-2 (tl/local-now)))
  ([date-time]
   (tf/unparse custom-formatter-2 date-time)))

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

(defn today-name
  []
  (tf/unparse mmm-do-yyyy-formatter (t/today)))

(defn tomorrow
  []
  (journal-name (t/plus (start-of-day (tl/local-now)) (t/days 1))))

(defn yesterday
  []
  (journal-name (t/minus (start-of-day (tl/local-now)) (t/days 1))))

(defn get-current-time
  []
  (i18n/locale-format-time (js/Date.)))

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

(defn int->local-time-2
  [n]
  (tf/unparse
   yyyy-MM-dd-HH-mm-formatter
   (t/to-default-time-zone (tc/from-long n))))

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

(defn- nlp-page->i18n-key
  "Derives a :date.nlp/* i18n key from an English NLP page string.
  Example: \"Last Monday\" -> :date.nlp/last-monday"
  [s]
  (keyword "date.nlp" (-> s string/lower-case (string/replace " " "-"))))

(defn- with-i18n-titles
  "Wraps a collection of English display strings, returning a seq of maps with
  {:block/title <translated-label> :nlp-original-title <english-string>
   ...extra}.
  key-fn derives an i18n keyword from each English string.
  t-fn is the translation function (frontend.context.i18n/t)."
  [items key-fn t-fn extra]
  (map (fn [en]
         (merge extra
                {:block/title (t-fn (key-fn en))
                 :nlp-original-title en}))
       items))

(defn nlp-pages-i18n
  "Returns nlp-pages as a seq of maps with translated :block/title labels.
  :nlp-original-title preserves the English string for chrono-node NLP parsing.
  Accepts optional keyword args merged into every output map."
  [& {:as extra}]
  (with-i18n-titles nlp-pages nlp-page->i18n-key i18n/t extra))

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
