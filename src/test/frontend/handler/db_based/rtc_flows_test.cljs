(ns frontend.handler.db-based.rtc-flows-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]))

(deftest resume-restart-events-do-not-depend-on-cached-rtc-lock-test
  (is (= :document-visible&rtc-not-running
         (#'rtc-flows/document-visible->restart-event "visible")))
  (is (= :network-online&rtc-not-running
         (#'rtc-flows/network-online->restart-event true)))
  (is (= :mobile-app-active&rtc-not-running
         (#'rtc-flows/mobile-app-active->restart-event true))))
