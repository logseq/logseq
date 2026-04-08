(ns frontend.date-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.local :as tl]
            [frontend.date :as date]
            [frontend.state :as state]))

(defn- set-language!
  [language]
  (state/set-preferred-language! language))

(def test-date-time (t/date-time 2026 4 5 12 7 8))
(def test-date (t/date-time 2026 4 5))
(def test-js-date (js/Date. 2026 3 5 12 7 8))

(use-fixtures :each
  (fn [f]
    (state/set-state! :preferred-language nil)
    (f)
    (state/set-state! :preferred-language nil)))

(deftest nld-parse-test
  (let [result (date/nld-parse "April 5, 2026")]
    (is (instance? js/Date result))
    (is (= 2026 (.getFullYear result)))
    (is (= 3 (.getMonth result)))
    (is (= 5 (.getDate result)))
    (is (nil? (date/nld-parse nil)))))

(deftest journal-title-formatters-test
  (with-redefs [state/get-date-formatter (constantly "yyyy-MM-dd")]
    (let [formatters (date/journal-title-formatters)]
      (is (= "yyyy-MM-dd" (first formatters)))
      (is (= 1 (count (filter #{"yyyy-MM-dd"} formatters))))
      (is (some #{"MMM do, yyyy"} formatters)))))

(deftest get-date-time-string-test
  (let [default-output (date/get-date-time-string test-date-time)]
    (is (re-matches #"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})"
                    default-output))
    (is (= default-output
           (date/get-date-time-string test-date-time
                                      :formatter-str "yyyy-MM-dd'T'HH:mm:ssZZ")))
    (is (= (tf/unparse (tf/formatter "yyyy/MM/dd HH:mm") test-date-time)
           (date/get-date-time-string test-date-time
                                      :formatter-str "yyyy/MM/dd HH:mm")))))

(deftest get-date-time-string-2-test
  (is (= "2026-04-05-12-07-08"
         (date/get-date-time-string-2 test-date-time))))

(deftest journal-name-test
  (with-redefs [state/get-date-formatter (constantly "yyyy/MM/dd")]
    (is (= "2026/04/05"
           (date/journal-name test-date-time)))))

(deftest start-of-day-test
  (let [result (date/start-of-day test-date-time)]
    (is (= 2026 (t/year result)))
    (is (= 4 (t/month result)))
    (is (= 5 (t/day result)))
    (is (= 0 (t/hour result)))
    (is (= 0 (t/minute result)))
    (is (= 0 (t/second result)))))

(deftest relative-journal-name-test
  (with-redefs [state/get-date-formatter (constantly "yyyy-MM-dd")
                tl/local-now (constantly test-date-time)
                t/today (constantly test-date)]
    (is (= "2026-04-05" (date/today)))
    (is (= "Apr 5th, 2026" (date/today-name)))
    (is (= "2026-04-06" (date/tomorrow)))
    (is (= "2026-04-04" (date/yesterday)))))

(deftest get-current-time-test
  (set-language! :en)
  (is (re-matches #"\d{2}:\d{2}" (date/get-current-time)))

  (set-language! :id)
  (is (re-matches #"\d{2}\.\d{2}" (date/get-current-time))))

(deftest journal-title-parsing-test
  (with-redefs [state/get-date-formatter (constantly "yyyy-MM-dd")]
    (is (true? (date/valid-journal-title? "2026-04-05")))
    (is (false? (date/valid-journal-title? "not-a-journal")))
    (is (= "20260405"
           (date/journal-title-> "2026-04-05"
                                 #(tf/unparse (tf/formatter "yyyyMMdd") %))))
    (is (= "20260405"
           (date/journal-title-> "2026/04/05"
                                 #(tf/unparse (tf/formatter "yyyyMMdd") %)
                                 ["yyyy/MM/dd"])))
    (is (nil? (date/journal-title-> " " identity)))
    (is (= 20260405 (date/journal-title->int "2026-04-05")))
    (is (= (tc/to-long (tf/parse (tf/formatter "yyyy-MM-dd") "2026-04-05"))
           (date/journal-title->long "2026-04-05")))))

(deftest journal-day->utc-ms-test
  (is (= (tc/to-long (tf/parse (tf/formatter "yyyyMMdd") "20260405"))
         (date/journal-day->utc-ms 20260405)))
  (is (nil? (date/journal-day->utc-ms nil))))

(deftest int->local-time-2-test
  (is (= (tf/unparse (tf/formatter "yyyy-MM-dd HH:mm")
                     (t/to-default-time-zone (tc/from-long (tc/to-long test-date-time))))
         (date/int->local-time-2 (tc/to-long test-date-time)))))

(deftest parse-iso-test
  (let [result (date/parse-iso "2026-04-05T09:07:08.0000Z")]
    (is (= 2026 (t/year result)))
    (is (= 4 (t/month result)))
    (is (= 5 (t/day result)))
    (is (= 9 (t/hour result)))
    (is (= 7 (t/minute result)))
    (is (= 8 (t/second result)))))

(deftest js-date->journal-title-test
  (with-redefs [state/get-date-formatter (constantly "yyyy-MM-dd")]
    (is (= "2026-04-05"
           (date/js-date->journal-title test-js-date)))))

(deftest js-date->goog-date-test
  (let [goog-date (date/js-date->goog-date test-js-date)
        passthrough :already-goog-date]
    (is (= 2026 (.getFullYear goog-date)))
    (is (= 3 (.getMonth goog-date)))
    (is (= 5 (.getDate goog-date)))
    (is (= passthrough (date/js-date->goog-date passthrough)))))
