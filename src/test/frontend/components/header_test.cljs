(ns frontend.components.header-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.header :as header]
            [frontend.state :as state]))

(deftest rtc-graph-uuid-is-not-loaded-before-db-worker-is-ready
  (testing "desktop header does not invoke the DB worker before initialization"
    (let [calls (atom [])]
      (with-redefs [state/<invoke-db-worker (fn [& args]
                                              (swap! calls conj args))]
        (is (nil? (header/<load-rtc-graph-uuid "graph" false)))
        (is (empty? @calls))))))

(deftest rtc-graph-uuid-is-loaded-after-db-worker-is-ready
  (let [calls (atom [])]
    (with-redefs [state/<invoke-db-worker (fn [& args]
                                            (swap! calls conj args)
                                            :graph-uuid)]
      (is (= :graph-uuid (header/<load-rtc-graph-uuid "graph" true)))
      (is (= [[:thread-api/get-rtc-graph-uuid "graph"]]
             @calls)))))
