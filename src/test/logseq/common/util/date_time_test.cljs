(ns logseq.common.util.date-time-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.common.util.date-time :as date-time-util]))

(deftest int->journal-title-keeps-calendar-day-test
  (testing "journal-day 20260405 is April 5 regardless of local UTC offset"
    (is (= "Apr 5th, 2026"
           (date-time-util/int->journal-title 20260405 "MMM do, yyyy")))
    (is (= "2026-04-05"
           (date-time-util/int->journal-title 20260405 "yyyy-MM-dd"))))
  (testing "local js/Date uses the same Y/M/D the date picker stores"
    (let [local-date (date-time-util/int->local-date 20260405)]
      (is (= 2026 (.getFullYear local-date)))
      (is (= 3 (.getMonth local-date)))
      (is (= 5 (.getDate local-date)))))
  (testing "UTC midnight of the journal-day can fall on the previous local day"
    (let [utc-midnight (js/Date. (date-time-util/journal-day->ms 20260405))
          local-date (date-time-util/int->local-date 20260405)]
      (is (= 5 (.getDate local-date))
          "Date picker encoding must not follow UTC midnight truncation")
      (when (pos? (.getTimezoneOffset utc-midnight))
        (is (not= (.getDate utc-midnight) (.getDate local-date))
            "This host's offset would hide the calendar day if titles used UTC ms")))))

(deftest int->journal-title-fails-fast-on-invalid-day-test
  (is (thrown? js/Error
               (date-time-util/int->journal-title 20261301 "yyyy-MM-dd"))
      "Month 13 is not a calendar day")
  (is (thrown? js/Error
               (date-time-util/int->journal-title 20260231 "yyyy-MM-dd"))
      "February 31 is not a calendar day")
  (is (thrown? js/Error
               (date-time-util/int->journal-title "20260405" "yyyy-MM-dd"))
      "Journal-day keys must be integers")
  (is (nil? (date-time-util/int->journal-title nil "yyyy-MM-dd"))))

(deftest journal-page-display-title-uses-journal-day-when-stored-title-blank-test
  (let [page {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"
              :block/title ""
              :block/name ""
              :block/journal-day 20260405
              :block/tags [{:db/ident :logseq.class/Journal}]}]
    (is (= "Apr 5th, 2026"
           (date-time-util/journal-page-display-title page))
        "Referenced dates must stay visible when the stored title is blank")
    (is (= "Apr 5th, 2026"
           (:block/title (date-time-util/with-journal-display-title page))))
    (is (not (string/blank? (date-time-util/journal-page-display-title page))))))
