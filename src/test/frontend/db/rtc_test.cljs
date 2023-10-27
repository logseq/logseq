(ns frontend.db.rtc-test
  (:require [clojure.test :as t :refer [deftest is use-fixtures]]
            [frontend.db.rtc.fixture :as rtc-fixture]
            [frontend.test.helper :as test-helper]
            [spy.core :as spy]))

(use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  rtc-fixture/start-and-stop-rtc-loop-fixture)

(deftest rtc-loop-init-test
  (let [ws @(:*ws @rtc-fixture/*test-rtc-state)
        push-data-fn (:push-data-fn ws)
        last-ws-msg (first (spy/last-call push-data-fn))]
    (is (= "register-graph-updates" (:action last-ws-msg)))))
