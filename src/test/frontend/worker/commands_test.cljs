(ns frontend.worker.commands-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [frontend.worker.commands :as commands]))

(def get-next-time #'commands/get-next-time)
(def minute-unit {:db/ident :logseq.property.repeat/recur-unit.minute})
(def hour-unit {:db/ident :logseq.property.repeat/recur-unit.hour})
(def day-unit {:db/ident :logseq.property.repeat/recur-unit.day})
(def week-unit {:db/ident :logseq.property.repeat/recur-unit.week})
(def month-unit {:db/ident :logseq.property.repeat/recur-unit.month})
(def year-unit {:db/ident :logseq.property.repeat/recur-unit.year})

(deftest ^:large-vars/cleanup-todo get-next-time-test
  (let [now (t/now)
        one-minute-ago (t/minus now (t/minutes 1))
        one-hour-ago (t/minus now (t/hours 1))
        one-day-ago (t/minus now (t/days 1))
        one-week-ago (t/minus now (t/weeks 1))
        one-month-ago (t/minus now (t/months 1))
        one-year-ago (t/minus now (t/years 1))
        in-minutes (fn [next-time] (/ (- next-time now) (* 1000 60)))
        in-hours (fn [next-time] (/ (- next-time now) (* 1000 60 60)))
        in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
        in-weeks (fn [next-time] (/ (- next-time now) (* 1000 60 60 24 7)))
        in-months (fn [next-time] (t/in-months (t/interval now (tc/from-long next-time))))
        in-years (fn [next-time] (t/in-years (t/interval now (tc/from-long next-time))))]
    (testing "basic test for get-next-time"
      ;; minute
      (let [next-time (get-next-time now minute-unit 1)]
        (is (= 1 (in-minutes next-time))))
      (let [next-time (get-next-time one-minute-ago minute-unit 1)]
        (is (= 1 (in-minutes next-time))))
      (let [next-time (get-next-time one-minute-ago minute-unit 3)]
        (is (= 2 (in-minutes next-time))))
      (let [next-time (get-next-time one-minute-ago minute-unit 5)]
        (is (= 4 (in-minutes next-time))))

      ;; hour
      (let [next-time (get-next-time now hour-unit 1)]
        (is (= 1 (in-hours next-time))))
      (let [next-time (get-next-time one-hour-ago hour-unit 1)]
        (is (= 1 (in-hours next-time))))
      (let [next-time (get-next-time one-hour-ago hour-unit 3)]
        (is (= 2 (in-hours next-time))))
      (let [next-time (get-next-time one-hour-ago hour-unit 5)]
        (is (= 4 (in-hours next-time))))

      ;; day
      (let [next-time (get-next-time now day-unit 1)]
        (is (= 1 (in-days next-time))))
      (let [next-time (get-next-time one-day-ago day-unit 1)]
        (is (= 1 (in-days next-time))))
      (let [next-time (get-next-time one-day-ago day-unit 3)]
        (is (= 2 (in-days next-time))))
      (let [next-time (get-next-time one-day-ago day-unit 5)]
        (is (= 4 (in-days next-time))))

      ;; week
      (let [next-time (get-next-time now week-unit 1)]
        (is (= 1 (in-weeks next-time))))
      (let [next-time (get-next-time one-week-ago week-unit 1)]
        (is (= 1 (in-weeks next-time))))
      (let [next-time (get-next-time one-week-ago week-unit 3)]
        (is (= 2 (in-weeks next-time))))
      (let [next-time (get-next-time one-week-ago week-unit 5)]
        (is (= 4 (in-weeks next-time))))

      ;; month
      (let [next-time (get-next-time now month-unit 1)]
        (is (= 1 (in-months next-time))))
      (let [next-time (get-next-time one-month-ago month-unit 1)]
        (is (= 1 (in-months next-time))))
      (let [next-time (get-next-time one-month-ago month-unit 3)]
        (is (= 2 (in-months next-time))))
      (let [next-time (get-next-time one-month-ago month-unit 5)]
        (is (= 4 (in-months next-time))))

      ;; year
      (let [next-time (get-next-time now year-unit 1)]
        (is (= 1 (in-years next-time))))
      (let [next-time (get-next-time one-year-ago year-unit 1)]
        (is (= 1 (in-years next-time))))
      (let [next-time (get-next-time one-year-ago year-unit 3)]
        (is (= 2 (in-years next-time))))
      (let [next-time (get-next-time one-year-ago year-unit 5)]
        (is (= 4 (in-years next-time)))))

    (testing "preserves week day"
      (let [next-time (get-next-time now week-unit 1)]
        (is (= (t/day-of-week (tc/from-long next-time)) (t/day-of-week now))))
      (let [next-time (get-next-time one-week-ago week-unit 1)]
        (is (= (t/day-of-week (tc/from-long next-time)) (t/day-of-week now)))))

    (testing "schedule on future time should move it to the next one"
      (let [next-time (get-next-time (t/plus now (t/minutes 10)) minute-unit 1)]
        (is (= 11 (in-minutes next-time))))
      (let [next-time (get-next-time (t/plus now (t/hours 10)) hour-unit 1)]
        (is (= 11 (in-hours next-time))))
      (let [next-time (get-next-time (t/plus now (t/days 10)) day-unit 1)]
        (is (= 11 (in-days next-time))))
      (let [next-time (get-next-time (t/plus now (t/weeks 10)) week-unit 1)]
        (is (= 11 (in-weeks next-time))))
      (let [next-time (get-next-time (t/plus now (t/months 10)) month-unit 1)]
        (is (= 11 (in-months next-time))))
      (let [next-time (get-next-time (t/plus now (t/years 10)) year-unit 1)]
        (is (= 11 (in-years next-time)))))

    (testing "schedule on past time should move it to future"
      (let [next-time (get-next-time (t/minus now (t/minutes 10)) minute-unit 1)]
        (is (= 1 (in-minutes next-time))))
      (let [next-time (get-next-time (t/minus now (t/hours 10)) hour-unit 1)]
        (is (= 1 (in-hours next-time))))
      (let [next-time (get-next-time (t/minus now (t/days 10)) day-unit 1)]
        (is (= 1 (in-days next-time))))
      (let [next-time (get-next-time (t/minus now (t/weeks 10)) week-unit 1)]
        (is (= 1 (in-weeks next-time))))
      (let [next-time (get-next-time (t/minus now (t/months 10)) month-unit 1)]
        (is (= 1 (in-months next-time))))
      (let [next-time (get-next-time (t/minus now (t/years 10)) year-unit 1)]
        (is (= 1 (in-years next-time)))))))
