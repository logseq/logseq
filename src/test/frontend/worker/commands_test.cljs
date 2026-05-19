(ns frontend.worker.commands-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.commands :as commands]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]))

(defn- get-next-time
  "Test helper. Three-arg form uses the `:double-plus` default (preserves prior
  test expectations); four-arg form passes the repeat-type explicitly."
  ([current-value unit frequency]
   (get-next-time current-value unit frequency :logseq.property.repeat/repeat-type.double-plus))
  ([current-value unit frequency repeat-type]
   (#'commands/get-next-time current-value unit frequency repeat-type)))

(def minute-unit {:db/ident :logseq.property.repeat/recur-unit.minute})
(def hour-unit {:db/ident :logseq.property.repeat/recur-unit.hour})
(def day-unit {:db/ident :logseq.property.repeat/recur-unit.day})
(def week-unit {:db/ident :logseq.property.repeat/recur-unit.week})
(def month-unit {:db/ident :logseq.property.repeat/recur-unit.month})
(def year-unit {:db/ident :logseq.property.repeat/recur-unit.year})

(def dotted-plus :logseq.property.repeat/repeat-type.dotted-plus)
(def plus :logseq.property.repeat/repeat-type.plus)
(def double-plus :logseq.property.repeat/repeat-type.double-plus)

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
    (with-redefs [t/now (fn [] now)]
      (testing "basic test for get-next-time (default :double-plus semantics)"
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
          (is (> (in-days next-time) 1)))
        (let [next-time (get-next-time one-month-ago month-unit 3)]
          (is (contains? #{1 2} (in-months next-time))))
        (let [next-time (get-next-time one-month-ago month-unit 5)]
          (is (contains? #{3 4} (in-months next-time))))

        ;; year
        (let [next-time (get-next-time now year-unit 1)]
          (is (= 1 (in-years next-time))))
        (let [next-time (get-next-time one-year-ago year-unit 1)]
          (is (= 1 (in-years next-time))))
        (let [next-time (get-next-time one-year-ago year-unit 3)]
          (is (= 2 (in-years next-time))))
        (let [next-time (get-next-time one-year-ago year-unit 5)]
          (is (= 4 (in-years next-time)))))

      (testing "preserves week day (default :double-plus)"
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
          ;; Lenient assertion adopted from upstream — `t/in-months` can return
          ;; 10 or 11 around month-end boundaries even with `t/now` pinned.
          (is (contains? #{10 11} (in-months next-time))))
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
          (is (> (in-days next-time) 1)))
        (let [next-time (get-next-time (t/minus now (t/years 10)) year-unit 1)]
          (is (= 1 (in-years next-time))))))))

(deftest dotted-plus-advances-from-completion-test
  (testing "`.+` always anchors on now (completion), regardless of original schedule"
    (let [now (t/now)
          in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
          in-weeks (fn [next-time] (/ (- next-time now) (* 1000 60 60 24 7)))
          in-years (fn [next-time] (t/in-years (t/interval now (tc/from-long next-time))))]
      (with-redefs [t/now (fn [] now)]
        ;; Weekly task scheduled 4 days ago and completed today:
        ;; `.+1w` expects completion + 1 week (7 days from now), not original + 1 week (3 days from now).
        (let [four-days-ago (t/minus now (t/days 4))
              next-time (get-next-time four-days-ago week-unit 1 dotted-plus)]
          (is (= 7 (in-days next-time))))
        ;; Weekly completed long after original: still completion + 1 week.
        (let [ten-weeks-ago (t/minus now (t/weeks 10))
              next-time (get-next-time ten-weeks-ago week-unit 1 dotted-plus)]
          (is (= 1 (in-weeks next-time))))
        ;; Monthly scheduled 10 days ago: completion + 1 month (28–31 days).
        (let [ten-days-ago (t/minus now (t/days 10))
              next-time (get-next-time ten-days-ago month-unit 1 dotted-plus)]
          (is (> (in-days next-time) 27)))
        ;; Yearly scheduled 3 months ago: completion + 1 year.
        (let [three-months-ago (t/minus now (t/months 3))
              next-time (get-next-time three-months-ago year-unit 1 dotted-plus)]
          (is (= 1 (in-years next-time))))
        ;; Even when the original is in the future, `.+` still anchors on now —
        ;; this is the deliberate semantic: the completion moment becomes the new anchor.
        (let [three-days-future (t/plus now (t/days 3))
              next-time (get-next-time three-days-future week-unit 1 dotted-plus)]
          (is (= 7 (in-days next-time))))))))

(deftest plus-advances-from-scheduled-test
  (testing "`+` advances from the original scheduled date; can land in the past (documented stacking)"
    (let [now (t/now)
          in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
          in-weeks (fn [next-time] (/ (- next-time now) (* 1000 60 60 24 7)))]
      (with-redefs [t/now (fn [] now)]
        ;; Weekly scheduled 10 days ago: result = original + 1 week = 3 days ago (stacked).
        (let [ten-days-ago (t/minus now (t/days 10))
              next-time (get-next-time ten-days-ago week-unit 1 plus)]
          (is (= -3 (in-days next-time))))
        ;; Weekly scheduled 4 days ago: result = original + 1 week = 3 days from now.
        (let [four-days-ago (t/minus now (t/days 4))
              next-time (get-next-time four-days-ago week-unit 1 plus)]
          (is (= 3 (in-days next-time))))
        ;; Future-scheduled: result = original + 1 week (no completion adjustment).
        (let [three-days-future (t/plus now (t/days 3))
              next-time (get-next-time three-days-future week-unit 1 plus)]
          (is (= 10 (in-days next-time))))
        ;; Every-3-weeks, scheduled 5 weeks ago: result = original + 3 weeks = 2 weeks ago.
        (let [five-weeks-ago (t/minus now (t/weeks 5))
              next-time (get-next-time five-weeks-ago week-unit 3 plus)]
          (is (= -2 (in-weeks next-time))))))))

(deftest double-plus-advances-until-future-test
  (testing "`++` advances in whole intervals until strictly after now; preserves weekday for weekly"
    (let [now (t/now)
          in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
          in-weeks (fn [next-time] (/ (- next-time now) (* 1000 60 60 24 7)))]
      (with-redefs [t/now (fn [] now)]
        ;; Weekly scheduled 10 days ago: original + 1 week = 3 days ago (still past),
        ;; step again to original + 2 weeks = 4 days from now.
        (let [ten-days-ago (t/minus now (t/days 10))
              next-time (get-next-time ten-days-ago week-unit 1 double-plus)]
          (is (= 4 (in-days next-time))))
        ;; Weekly scheduled 4 days ago: original + 1 week = 3 days from now (already future).
        (let [four-days-ago (t/minus now (t/days 4))
              next-time (get-next-time four-days-ago week-unit 1 double-plus)]
          (is (= 3 (in-days next-time))))
        ;; Weekday preservation: landed occurrence should match the scheduled day-of-week.
        (let [ten-days-ago (t/minus now (t/days 10))
              next-time (get-next-time ten-days-ago week-unit 1 double-plus)]
          (is (= (t/day-of-week (tc/from-long next-time))
                 (t/day-of-week ten-days-ago))))
        ;; Every-3-weeks: scheduled 5 weeks ago → original + 6 weeks = 1 week from now.
        (let [five-weeks-ago (t/minus now (t/weeks 5))
              next-time (get-next-time five-weeks-ago week-unit 3 double-plus)]
          (is (= 1 (in-weeks next-time))))))))

(deftest repeat-type-defaults-to-double-plus-test
  (testing "Missing/unknown repeat-type falls back to :double-plus (preserves prior behavior on upgrade)"
    (let [now (t/now)
          in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
          ten-days-ago (t/minus now (t/days 10))]
      (with-redefs [t/now (fn [] now)]
        (let [via-nil     (get-next-time ten-days-ago week-unit 1 nil)
              via-default (get-next-time ten-days-ago week-unit 1 double-plus)]
          (is (= via-nil via-default))
          (is (= 4 (in-days via-nil))))))))

(deftest get-next-time-rejects-non-positive-frequency-test
  (testing "Frequency of 0 or negative returns nil instead of looping or producing nonsense"
    (let [now (t/now)
          ten-days-ago (t/minus now (t/days 10))]
      (with-redefs [t/now (fn [] now)]
        (is (nil? (get-next-time ten-days-ago week-unit 0)))
        (is (nil? (get-next-time ten-days-ago week-unit -1)))
        (is (nil? (get-next-time ten-days-ago week-unit 0 dotted-plus)))
        (is (nil? (get-next-time ten-days-ago week-unit -2 plus)))))))

(deftest get-next-time-rejects-unknown-unit-test
  (testing "Unknown unit returns nil"
    (let [now (t/now)]
      (with-redefs [t/now (fn [] now)]
        (is (nil? (get-next-time now {} 1)))
        (is (nil? (get-next-time now {:db/ident :bogus} 1 dotted-plus)))))))

(deftest dotted-plus-frequency-greater-than-one-test
  (testing "`.+` with frequency > 1 across units"
    (let [now (t/now)
          in-minutes (fn [next-time] (/ (- next-time now) (* 1000 60)))
          in-days (fn [next-time] (/ (- next-time now) (* 1000 60 60 24)))
          in-weeks (fn [next-time] (/ (- next-time now) (* 1000 60 60 24 7)))]
      (with-redefs [t/now (fn [] now)]
        (let [next-time (get-next-time (t/minus now (t/hours 5)) minute-unit 15 dotted-plus)]
          (is (= 15 (in-minutes next-time))))
        (let [next-time (get-next-time (t/minus now (t/days 2)) day-unit 5 dotted-plus)]
          (is (= 5 (in-days next-time))))
        (let [next-time (get-next-time (t/minus now (t/weeks 1)) week-unit 3 dotted-plus)]
          (is (= 3 (in-weeks next-time))))))))

(deftest double-plus-month-and-year-test
  (testing "`++` on month/year units also lands strictly in the future"
    (let [now (t/now)
          in-months (fn [next-time] (t/in-months (t/interval now (tc/from-long next-time))))
          in-years (fn [next-time] (t/in-years (t/interval now (tc/from-long next-time))))]
      (with-redefs [t/now (fn [] now)]
        ;; Monthly scheduled 2 months ago, frequency 1: original + 3 months = 1 month from now.
        (let [two-months-ago (t/minus now (t/months 2))
              next-time (get-next-time two-months-ago month-unit 1 double-plus)]
          (is (contains? #{0 1} (in-months next-time))))
        ;; Every-3-months, scheduled 5 months ago: original + 6 months = 1 month from now.
        (let [five-months-ago (t/minus now (t/months 5))
              next-time (get-next-time five-months-ago month-unit 3 double-plus)]
          (is (contains? #{0 1} (in-months next-time))))
        ;; Yearly scheduled 2 years ago: original + 3 years = 1 year from now.
        (let [two-years-ago (t/minus now (t/years 2))
              next-time (get-next-time two-years-ago year-unit 1 double-plus)]
          (is (= 1 (in-years next-time))))))))

(deftest double-plus-month-clamp-stays-future-test
  (testing "`++` keeps advancing after month-end clamping until the result is future"
    (let [now (t/date-time 2026 3 30)
          scheduled (t/date-time 2026 1 31)]
      (with-redefs [t/now (fn [] now)]
        (is (t/after? (tc/from-long (get-next-time scheduled month-unit 1 double-plus))
                      now))))))

(deftest double-plus-far-overdue-minute-is-bounded-test
  (testing "`++` does not advance far-overdue minute repeats one interval at a time"
    (let [now (t/now)
          two-years-ago (t/minus now (t/years 2))
          unit-calls (atom 0)
          minutes (fn [frequency]
                    (swap! unit-calls inc)
                    (when (> @unit-calls 1000)
                      (throw (ex-info "Too many recurrence unit calls" {:calls @unit-calls})))
                    (t/minutes frequency))
          result (with-redefs [t/now (fn [] now)]
                   (try
                     (#'commands/repeat-next-timestamp two-years-ago minutes t/in-minutes 1 double-plus)
                     (catch :default e e)))]
      (is (not (instance? js/Error result))
          "Far-overdue minutely repeats should compute without unbounded iteration")
      (when-not (instance? js/Error result)
        (is (= 1 (/ (- (tc/to-long result) (tc/to-long now)) (* 1000 60)))))
      (is (< @unit-calls 20)))))

(deftest resolve-recur-frequency-test
  (let [resolve (fn [db entity] (#'commands/resolve-recur-frequency db entity))]
    (testing "returns the explicit frequency when the property has a value"
      (with-redefs [db-property/property-value-content (fn [_] 5)]
        (let [[freq tx] (resolve :mock-db {})]
          (is (= 5 freq))
          (is (nil? tx)
              "no default-value tx needed when the property is already set"))))

    (testing "falls back to 1 and builds default-value tx when the property is unset"
      ;; Regression guard for the previous `(or [A B] [C D])` pattern, which
      ;; always selected the first branch (any 2-vector is truthy) and left
      ;; the default-value path unreachable. `if-let` is what makes both
      ;; branches reachable.
      (with-redefs [db-property/property-value-content (fn [_] nil)
                    d/entity (fn [_ _] {:db/id 42
                                        :block/uuid #uuid "00000000-0000-0000-0000-000000000001"})
                    db-property-build/build-property-value-block
                    (fn [_ _ value] {:block/uuid #uuid "00000000-0000-0000-0000-000000000002"
                                     :logseq.property/value value})]
        (let [[freq tx] (resolve :mock-db {})]
          (is (= 1 freq)
              "frequency defaults to 1 when the entity has no explicit value")
          (is (some? tx)
              "tx data is returned so the property's default-value block gets written")
          (is (= 2 (count tx))
              "tx has the value block and the property-default wiring"))))))
