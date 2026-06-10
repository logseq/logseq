(ns frontend.test.noise-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.test.noise :as test-noise]))

(deftest mute-console-fixture-forwards-test-failures-test
  (testing "ordinary noise is muted but cljs.test failure output is preserved"
    (let [original-log (aget js/console "log")
          calls (atom [])
          fixture (test-noise/mute-console-fixture
                   ::mute-console-fixture-forwards-test-failures-test
                   ["log"])]
      (aset js/console "log" (fn [& args]
                               (swap! calls conj (vec args))))
      ((:before fixture))
      (try
        (.log js/console "ordinary noise")
        (.log js/console "FAIL in (sample-test) (sample.cljs:1)")
        (.log js/console "expected: true")
        (is (= [["FAIL in (sample-test) (sample.cljs:1)"]
                ["expected: true"]]
               @calls))
        (finally
          ((:after fixture))
          (aset js/console "log" original-log))))))
