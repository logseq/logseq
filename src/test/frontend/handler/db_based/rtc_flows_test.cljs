(ns frontend.handler.db-based.rtc-flows-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.config :as config]
            [frontend.handler.db-based.rtc-background-tasks :as rtc-background-tasks]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]))

(deftest resume-restart-events-do-not-depend-on-cached-rtc-lock-test
  (is (= :document-visible&rtc-not-running
         (#'rtc-flows/document-visible->restart-event "visible")))
  (is (= :network-online&rtc-not-running
         (#'rtc-flows/network-online->restart-event true)))
  (is (= :mobile-app-active&rtc-not-running
         (#'rtc-flows/mobile-app-active->restart-event true))))

(deftest rtc-background-watch-consumes-existing-event-test
  (let [source (atom [:graph-switch "repo"])
        events (atom [])]
    (with-redefs [config/publishing? false]
      (#'rtc-background-tasks/add-watch-when-not-publishing!
       source
       ::consume-existing-event
       #(swap! events conj %))
      (is (= [[:graph-switch "repo"]] @events))
      (remove-watch source ::consume-existing-event))))
