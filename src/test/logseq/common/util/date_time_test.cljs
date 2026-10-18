(ns logseq.common.util.date-time-test
  "Local calendar-day range for Scheduled/Deadline (db-test#1352).

  TZ fixtures use fixed UTC offsets (minutes east of UTC). Date-only values
  are local midnight; timed values use the same offset. The production helper
  uses the process timezone via js/Date; run this ns under Asia/Tokyo,
  Europe/Berlin, America/New_York, and UTC to exercise both sides of UTC."
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.util.date-time :as date-time-util]))

(def ^:private today 20260928)
(def ^:private yesterday 20260927)
(def ^:private plus-6 20261004)
(def ^:private plus-7 20261005)
(def ^:private future-days 7)

(def ^:private tz-fixtures
  [{:id "Asia/Tokyo" :offset-min 540}
   {:id "Europe/Berlin" :offset-min 120}
   {:id "America/New_York" :offset-min -240}
   {:id "UTC-12" :offset-min -720}
   {:id "UTC" :offset-min 0}])

(defn- journal-day->ms-at-offset
  "Local midnight of `day` in a timezone `offset-min` minutes east of UTC."
  [day offset-min]
  (- (date-time-util/journal-day->ms day) (* offset-min 60 1000)))

(defn- local-date-time-ms
  [day hour offset-min]
  (+ (journal-day->ms-at-offset day offset-min)
     (* hour 60 60 1000)))

(defn- in-range?
  [ms start end]
  (<= start ms end))

(deftest journal-day-plus-test
  (is (= plus-7 (date-time-util/journal-day-plus today future-days)))
  (is (= 20260301 (date-time-util/journal-day-plus 20260228 1)))
  (is (nil? (date-time-util/journal-day-plus nil 1))))

(deftest journal-day->local-ms-is-local-midnight
  (let [day 20260928
        local (date-time-util/journal-day->local-ms day)
        js-local (.getTime (js/Date. 2026 8 28))
        utc (date-time-util/journal-day->ms day)
        offset-min (.getTimezoneOffset (js/Date. 2026 8 28))]
    (is (= js-local local))
    (is (= (* offset-min 60 1000) (- local utc))
        "local midnight is UTC midnight plus Date.getTimezoneOffset (minutes west of UTC)")
    (is (= day (date-time-util/ms->journal-day local)))
    (is (nil? (date-time-util/journal-day->local-ms nil)))))

(deftest journal-day-local-range-ms-uses-local-calendar-days
  (let [[start end] (date-time-util/journal-day-local-range-ms today future-days)
        today-no-time (.getTime (js/Date. 2026 8 28 0 0 0 0))
        yesterday-21 (.getTime (js/Date. 2026 8 27 21 0 0 0))
        plus6-21 (.getTime (js/Date. 2026 9 4 21 0 0 0))
        plus7-no-time (.getTime (js/Date. 2026 9 5 0 0 0 0))
        plus7-21 (.getTime (js/Date. 2026 9 5 21 0 0 0))]
    (is (= today-no-time start))
    (is (= plus7-no-time end))
    (is (in-range? today-no-time start end)
        "today without a time is listed")
    (is (not (in-range? yesterday-21 start end))
        "yesterday 21:00 is not listed as today")
    (is (in-range? plus6-21 start end)
        "6 days ahead at 21:00 is listed")
    (is (in-range? plus7-no-time start end)
        "the last day without a time is listed")
    (is (not (in-range? plus7-21 start end))
        "after local midnight of day+7 is outside the inclusive midnight window")
    (is (nil? (date-time-util/journal-day-local-range-ms nil future-days)))
    (is (nil? (date-time-util/journal-day-local-range-ms today nil)))))

(deftest scheduled-deadline-range-tz-fixtures-test
  (doseq [{:keys [id offset-min]} tz-fixtures]
    (testing id
      (let [start (journal-day->ms-at-offset today offset-min)
            end (journal-day->ms-at-offset plus-7 offset-min)
            utc-start (date-time-util/journal-day->ms today)
            utc-end (date-time-util/journal-day->ms plus-7)
            today-no-time start
            yesterday-21 (local-date-time-ms yesterday 21 offset-min)
            plus6-21 (local-date-time-ms plus-6 21 offset-min)
            plus7-no-time end
            utc-includes-today? (in-range? today-no-time utc-start utc-end)
            utc-includes-yesterday-21? (in-range? yesterday-21 utc-start utc-end)
            utc-includes-plus6-21? (in-range? plus6-21 utc-start utc-end)]
        (is (in-range? today-no-time start end)
            "today without a time is inside the local range")
        (is (not (in-range? yesterday-21 start end))
            "yesterday 21:00 is outside the local range")
        (is (in-range? plus6-21 start end)
            "6 days ahead at 21:00 is inside the local range")
        (is (in-range? plus7-no-time start end)
            "day+7 without a time is inside the local range")
        (when (pos? offset-min)
          (is (false? utc-includes-today?)
              "east of UTC, the old UTC range drops today's date-only task"))
        (when (neg? offset-min)
          (is (true? utc-includes-yesterday-21?)
              "west of UTC, the old UTC range lists yesterday 21:00 as today")
          (is (false? utc-includes-plus6-21?)
              "west of UTC, the old UTC range drops 6 days ahead at 21:00"))))))
