(ns logseq.graph-parser.exporter.clock-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [logseq.common.util.date-time :as date-time]
            [logseq.graph-parser.exporter.clock :as clock]))

(def ^:private refs {:todo :todo :doing :doing})

(defn- with-tz
  "Runs the tests under an explicit timezone so wall-clock expectations do not
  depend on the machine running them."
  [f]
  (let [orig (.-TZ js/process.env)]
    (set! (.-TZ js/process.env) "America/New_York")
    (try (f)
         (finally
           (if orig
             (set! (.-TZ js/process.env) orig)
             (js-delete js/process.env "TZ"))))))

(use-fixtures :once with-tz)

(defn- ms [y mo d h mi s] (date-time/local-datetime->ms y mo d h mi s))

(defn- history
  [lines status]
  (clock/build-history lines {:status (if (= status :doing) :doing status)
                              :doing? (= status :doing)}
                       refs))

(defn- event-seq [result] (mapv (juxt :ms :status) (:events result)))
(defn- diag-types [result] (mapv :type (:diagnostics result)))

(deftest parse-clock-line-test
  (testing "completed with seconds and duration"
    (let [c (clock/parse-clock-line "  CLOCK: [2021-11-07 Sun 12:00:15]--[2021-11-07 Sun 12:02:00] =>  00:01:45")]
      (is (= (ms 2021 11 7 12 0 15) (:start c)))
      (is (= (ms 2021 11 7 12 2 0) (:end c)))
      (is (= {:state :valid :raw "00:01:45" :ms 105000} (:duration c)))))
  (testing "optional seconds, optional weekday, case and spacing"
    (let [c (clock/parse-clock-line "clock:[2024-01-03 10:00]--[2024-01-03   Wed   11:30]=>1:30")]
      (is (= (ms 2024 1 3 10 0 0) (:start c)))
      (is (= (ms 2024 1 3 11 30 0) (:end c)))
      (is (= 5400000 (get-in c [:duration :ms])))))
  (testing "open clock"
    (let [c (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:07]")]
      (is (:open? c))
      (is (nil? (:end c)))
      (is (= (ms 2024 1 3 10 0 7) (:start c)))))
  (testing "absent versus present-but-invalid duration"
    (is (= :absent (:state (:duration (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00]")))))
    (is (= :invalid (:state (:duration (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  09:99:00")))))
    (is (= :invalid (:state (:duration (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>")))))
    (is (= :zero (:state (:duration (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  00:00:00"))))))
  (testing "durations over 24 hours are valid"
    (is (= (* 1000 (+ (* 51 3600) (* 30 60)))
           (:ms (clock/parse-duration-ms "51:30:00")))))
  (testing "non-clock lines are ignored, bad clock lines are malformed"
    (is (nil? (clock/parse-clock-line "  - State \"DONE\" from \"TODO\" [2024-01-03 Wed 10:00]")))
    (is (= :malformed-clock-line (:error (clock/parse-clock-line "CLOCK: garbage"))))
    (is (= :malformed-clock-line (:error (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00] trailing"))))
    (is (= :malformed-clock-line (:error (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 10:00:00] =>  01:00:00")))
        "open clock cannot carry a duration"))
  (testing "impossible dates are not normalized"
    (is (= :malformed-clock-line (:error (clock/parse-clock-line "CLOCK: [2024-02-30 Fri 10:00:00]--[2024-03-01 Fri 11:00:00]"))))
    (is (= :malformed-clock-line (:error (clock/parse-clock-line "CLOCK: [2024-01-03 Wed 25:00:00]"))))))

(deftest local-time-dst-test
  (testing "DST spring-forward gap is not a real local time"
    (is (nil? (ms 2022 3 13 2 30 0)))
    (is (some? (ms 2022 3 13 3 30 0))))
  (testing "DST fall-back repeated hour resolves to its first occurrence"
    (is (= (js/Date.parse "2021-11-07T05:30:00Z") (ms 2021 11 7 1 30 0))))
  (testing "wall clock across fall-back differs from elapsed time"
    (is (= (* 4 3600 1000) (- (ms 2021 11 7 3 0 0) (ms 2021 11 7 0 0 0))))))

(deftest parse-logbook-lines-test
  (let [{:keys [clocks diagnostics]}
        (clock/parse-logbook-lines
         ["  CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00" "\n"
          "  CLOCK: garbage" "\n"
          "  CLOCK: [2024-01-03 Wed 12:00:00]"])]
    (is (= [0 2] (mapv :source-index clocks)))
    (is (= [{:type :malformed-clock-line :source-index 1 :raw "  CLOCK: garbage"}] diagnostics))))

(def ^:private t10 (ms 2024 1 3 10 0 0))
(def ^:private t11 (ms 2024 1 3 11 0 0))
(def ^:private t13 (ms 2024 1 3 13 0 0))
(def ^:private t1430 (ms 2024 1 3 14 30 0))

(def ^:private two-clocks
  ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00" "\n"
   "CLOCK: [2024-01-03 Wed 13:00:00]--[2024-01-03 Wed 14:30:00] =>  01:30:00"])

(deftest status-history-test
  (testing "Done task: intermediate closes Todo, last closes with current status"
    (let [r (history two-clocks :done)]
      (is (= [[t10 :doing] [t11 :todo] [t13 :doing] [t1430 :done]] (event-seq r)))
      (is (= 2 (:completed-sessions r)))
      (is (= 0 (:open-sessions r)))
      (is (empty? (:diagnostics r)))))
  (testing "Todo task with one completed clock"
    (is (= [[t10 :doing] [t11 :todo]]
           (event-seq (history [(first two-clocks)] :todo)))))
  (testing "Doing task with completed clocks only closes the last with Todo"
    (is (= [[t10 :doing] [t11 :todo] [t13 :doing] [t1430 :todo]]
           (event-seq (history two-clocks :doing)))))
  (testing "Custom status closes the last interval"
    (is (= [[t10 :doing] [t11 :waiting]]
           (event-seq (history [(first two-clocks)] :waiting)))))
  (testing "Doing task with a final open clock"
    (let [r (history [(first two-clocks) "\n" "CLOCK: [2024-01-03 Wed 13:00:00]"] :doing)]
      (is (= [[t10 :doing] [t11 :todo] [t13 :doing]] (event-seq r)))
      (is (= 1 (:completed-sessions r)))
      (is (= 1 (:open-sessions r)))))
  (testing "Open clock on a non-Doing task is reported and produces no history"
    (doseq [status [:todo :done :canceled]]
      (let [r (history ["CLOCK: [2024-01-03 Wed 13:00:00]"] status)]
        (is (:skip? r))
        (is (nil? (:events r)))
        (is (= [:open-clock-inconsistent] (diag-types r))))))
  (testing "No logbook clock lines"
    (is (nil? (history [] :doing)))
    (is (nil? (history ["  - State \"DONE\""] :doing)))))

(deftest duration-reconciliation-test
  (testing "printed duration equal to the range emits no diagnostic"
    (let [r (history [(first two-clocks)] :done)]
      (is (empty? (:diagnostics r)))))
  (testing "shorter printed duration wins and is reported"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 14:00:00] =>  01:15:00"] :done)]
      (is (= [[t10 :doing] [(ms 2024 1 3 11 15 0) :done]] (event-seq r)))
      (is (= [:duration-adjusted] (diag-types r)))
      (is (= {:recorded-start t10 :recorded-end (ms 2024 1 3 14 0 0)
              :printed-duration "01:15:00" :effective-end (ms 2024 1 3 11 15 0)}
             (select-keys (first (:diagnostics r))
                          [:recorded-start :recorded-end :printed-duration :effective-end])))))
  (testing "longer printed duration wins"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 10:30:00] =>  05:00:00"] :done)]
      (is (= [[t10 :doing] [(ms 2024 1 3 15 0 0) :done]] (event-seq r)))
      (is (= [:duration-adjusted] (diag-types r)))))
  (testing "no printed duration uses the recorded range"
    (is (= [[t10 :doing] [t11 :done]]
           (event-seq (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00]"] :done)))))
  (testing "zero, negative and malformed durations fall back to a valid range"
    (doseq [d ["00:00:00" "-01:00:00" "nonsense" "09:99:00"]]
      (let [r (history [(str "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  " d)] :done)]
        (is (= [[t10 :doing] [t11 :done]] (event-seq r)) d)
        (is (= [:invalid-duration] (diag-types r)) d))))
  (testing "invalid duration and invalid range skips the task"
    (let [r (history ["CLOCK: [2024-01-03 Wed 11:00:00]--[2024-01-03 Wed 10:00:00] =>  00:00:00"] :done)]
      (is (:skip? r))
      (is (= #{:invalid-range :invalid-duration} (set (diag-types r))))))
  (testing "printed duration over 24 hours"
    (let [r (history ["CLOCK: [2024-01-03 Wed 00:00:00]--[2024-01-05 Fri 03:30:00] =>  51:30:00"] :done)]
      (is (empty? (:diagnostics r)))
      (is (= (* 1000 (+ (* 51 3600) (* 30 60)))
             (- (:ms (second (:events r))) (:ms (first (:events r)))))))))

(deftest ordering-and-overlap-test
  (testing "out-of-order clocks are sorted"
    (is (= [[t10 :doing] [t11 :todo] [t13 :doing] [t1430 :done]]
           (event-seq (history (reverse (filter #(not= "\n" %) two-clocks)) :done)))))
  (testing "a reversed range skips the task"
    (let [r (history ["CLOCK: [2024-01-03 Wed 11:00:00]--[2024-01-03 Wed 10:00:00]"] :done)]
      (is (:skip? r))
      (is (= [:invalid-range] (diag-types r)))))
  (testing "an adjusted duration that overlaps the next clock skips the task"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  05:00:00"
                      "CLOCK: [2024-01-03 Wed 13:00:00]--[2024-01-03 Wed 14:00:00]"] :done)]
      (is (:skip? r))
      (is (nil? (:events r)))
      (is (some #{:overlapping-clocks} (diag-types r)))))
  (testing "duplicate intervals overlap and skip the task"
    (let [line "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00]"
          r (history [line line] :done)]
      (is (:skip? r))
      (is (some #{:overlapping-clocks} (diag-types r)))))
  (testing "adjacent intervals keep strict order by moving the close back 1ms"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00]"
                      "CLOCK: [2024-01-03 Wed 11:00:00]--[2024-01-03 Wed 12:00:00]"] :done)
          times (mapv :ms (:events r))]
      (is (= [[t10 :doing] [(dec t11) :todo] [t11 :doing] [(ms 2024 1 3 12 0 0) :done]]
             (event-seq r)))
      (is (apply < times) "strictly increasing")
      (is (= [:boundary-adjusted] (diag-types r)))))
  (testing "multiple open clocks and non-final open clock skip the task"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]" "CLOCK: [2024-01-03 Wed 12:00:00]"] :doing)]
      (is (:skip? r))
      (is (= [:multiple-open-clocks] (diag-types r))))
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]"
                      "CLOCK: [2024-01-03 Wed 12:00:00]--[2024-01-03 Wed 13:00:00]"] :doing)]
      (is (:skip? r))
      (is (= [:open-clock-not-final] (diag-types r)))))
  (testing "one malformed line skips the whole task with no partial events"
    (let [r (history ["CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00]"
                      "CLOCK: garbage"] :done)]
      (is (:skip? r))
      (is (nil? (:events r))))))

(deftest midnight-and-dst-sessions-test
  (testing "crossing midnight"
    (let [r (history ["CLOCK: [2024-01-03 Wed 23:00:00]--[2024-01-04 Thu 01:00:00] =>  02:00:00"] :done)]
      (is (= (* 2 3600 1000) (- (:ms (second (:events r))) (:ms (first (:events r))))))))
  (testing "fall-back: wall clock 00:30-02:30 is 3 hours elapsed, matching the print"
    (let [r (history ["CLOCK: [2021-11-07 Sun 00:30:00]--[2021-11-07 Sun 02:30:00] =>  03:00:00"] :done)
          [a b] (:events r)]
      (is (= (* 3 3600 1000) (- (:ms b) (:ms a))))
      (is (empty? (:diagnostics r)))))
  (testing "fall-back: the printed duration wins when it disagrees with the elapsed time"
    (let [r (history ["CLOCK: [2021-11-07 Sun 00:30:00]--[2021-11-07 Sun 02:30:00] =>  02:00:00"] :done)
          [a b] (:events r)]
      (is (= (* 2 3600 1000) (- (:ms b) (:ms a))))
      (is (= [:duration-adjusted] (diag-types r)))))
  (testing "spring-forward: the printed 1-hour duration is authoritative"
    (let [r (history ["CLOCK: [2022-03-13 Sun 01:30:00]--[2022-03-13 Sun 03:30:00] =>  01:00:00"] :done)
          [a b] (:events r)]
      (is (= (* 3600 1000) (- (:ms b) (:ms a)))))))

(def ^:private zero "CLOCK: [2024-01-03 Wed 12:00:00]--[2024-01-03 Wed 12:00:00] =>  00:00:00")
(def ^:private zero-no-duration "CLOCK: [2024-01-03 Wed 12:00:00]--[2024-01-03 Wed 12:00:00]")
(def ^:private real-10-11 "CLOCK: [2024-01-03 Wed 10:00:00]--[2024-01-03 Wed 11:00:00] =>  01:00:00")
(def ^:private real-13-14 "CLOCK: [2024-01-03 Wed 13:00:00]--[2024-01-03 Wed 14:00:00] =>  01:00:00")

(deftest zero-length-clock-test
  (testing "a zero-length clock alone records no time and is not a skip"
    (doseq [line [zero zero-no-duration]]
      (let [r (history [line] :done)]
        (is (not (:skip? r)))
        (is (= [] (:events r)))
        (is (= 0 (:completed-sessions r)))
        (is (= [:zero-length-clock] (diag-types r)) "reported once, not also as an invalid duration"))))
  (testing "the task's other clocks are imported whatever the order"
    (is (= [[t10 :doing] [t11 :done]] (event-seq (history [zero real-10-11] :done))))
    (is (= [[t10 :doing] [t11 :done]] (event-seq (history [real-10-11 zero-no-duration] :done))))
    (let [r (history [real-10-11 zero real-13-14] :done)]
      (is (= [[t10 :doing] [t11 :todo] [t13 :doing] [(ms 2024 1 3 14 0 0) :done]] (event-seq r)))
      (is (= 2 (:completed-sessions r)))
      (is (= [:zero-length-clock] (diag-types r)))))
  (testing "a zero-length clock on a closing boundary creates no same-millisecond event"
    (let [r (history [real-10-11 "CLOCK: [2024-01-03 Wed 11:00:00]--[2024-01-03 Wed 11:00:00] =>  00:00:00" real-13-14] :done)
          times (mapv :ms (:events r))]
      (is (apply < times))
      (is (= 4 (count times)))))
  (testing "identical zero-length clocks are ignored, not reported as an overlap"
    (let [r (history [zero zero] :done)]
      (is (not (:skip? r)))
      (is (= [:zero-length-clock :zero-length-clock] (diag-types r)))))
  (testing "seconds are kept on the ignored entry's neighbours"
    (let [r (history ["CLOCK: [2024-01-03 Wed 11:29:42]--[2024-01-03 Wed 11:29:42] =>  00:00:00"
                      "CLOCK: [2024-01-03 Wed 11:29:35]--[2024-01-03 Wed 11:29:36] =>  00:00:01"] :done)]
      (is (= [[(ms 2024 1 3 11 29 35) :doing] [(ms 2024 1 3 11 29 36) :done]] (event-seq r)))))
  (testing "a Todo task closes its real clock with Todo"
    (is (= [[t10 :doing] [t11 :todo]] (event-seq (history [zero real-10-11] :todo)))))
  (testing "a Doing task keeps its open clock and its completed clock"
    (let [r (history [real-10-11 zero "CLOCK: [2024-01-03 Wed 15:00:00]"] :doing)]
      (is (= [[t10 :doing] [t11 :todo] [(ms 2024 1 3 15 0 0) :doing]] (event-seq r)))
      (is (= 1 (:open-sessions r)))))
  (testing "equal start and end with a valid printed duration still imports the duration"
    (let [r (history ["CLOCK: [2024-01-03 Wed 14:00:00]--[2024-01-03 Wed 14:00:00] =>  00:10:00"] :done)]
      (is (= [[(ms 2024 1 3 14 0 0) :doing] [(ms 2024 1 3 14 10 0) :done]] (event-seq r)))
      (is (= [:duration-adjusted] (diag-types r)))))
  (testing "genuine contradictions still skip the whole task"
    (let [r (history [zero "CLOCK: [2024-01-03 Wed 17:00:00]--[2024-01-03 Wed 16:00:00]"] :done)]
      (is (:skip? r))
      (is (nil? (:events r))))
    (let [r (history [zero "CLOCK: [2024-01-03 Wed 19:00:00]"] :todo)]
      (is (:skip? r))
      (is (some #{:open-clock-inconsistent} (diag-types r))))))
