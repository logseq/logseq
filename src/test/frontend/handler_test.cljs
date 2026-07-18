(ns frontend.handler-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.date :as date]
            [frontend.handler.page :as page-handler]))

(deftest date-watch-queries-the-journal-only-when-the-day-changes-test
  (let [today (atom "Jul 19th, 2026")
        create-count (atom 0)
        interval-callback (atom nil)
        interval-id (atom 0)
        cleared-intervals (atom [])
        original-set-interval js/setInterval
        original-clear-interval js/clearInterval]
    (set! js/setInterval
          (fn [callback _delay]
            (reset! interval-callback callback)
            (swap! interval-id inc)))
    (set! js/clearInterval #(swap! cleared-intervals conj %))
    (try
      (with-redefs [date/today #(deref today)
                    page-handler/create-today-journal! #(swap! create-count inc)]
        (page-handler/watch-for-date!)
        (testing "repeated checks on the same day reuse the loaded journal"
          (@interval-callback)
          (@interval-callback)
          (is (= 1 @create-count)))

        (testing "a day change refreshes the journal once"
          (reset! today "Jul 20th, 2026")
          (@interval-callback)
          (@interval-callback)
          (is (= 2 @create-count)))

        (testing "installing a watcher for another graph replaces the old timer"
          (page-handler/watch-for-date!)
          (is (= [1] @cleared-intervals))
          (is (= 3 @create-count))
          (@interval-callback)
          (is (= 3 @create-count))))
      (finally
        (set! js/setInterval original-set-interval)
        (set! js/clearInterval original-clear-interval)))))
