(ns frontend.db.rtc-test
  (:require [clojure.test :as t :refer [deftest is use-fixtures]]
            [frontend.db.rtc.fixture :as rtc-fixture]
            [frontend.test.helper :as test-helper]))

(use-fixtures :each
  test-helper/start-and-destroy-db-map-fixture
  rtc-fixture/start-and-stop-rtc-loop-fixture)


(deftest rtc-loop-test
  (prn :*test-rtc-state @rtc-fixture/*test-rtc-state)
  (is true))
