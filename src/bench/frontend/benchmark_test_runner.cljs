(ns frontend.benchmark-test-runner
  "Runs a benchmark"
  (:require [clojure.edn :as edn]
            [frontend.macros :refer [slurped]]
            [clojure.pprint :as pprint]
            [clojure.test :refer [deftest testing]]
            [fipp.edn :as fipp]
            [frontend.common.file.util :as wfu]))

(def onboarding
  (edn/read-string (slurped "resources/whiteboard/onboarding.edn")))

(deftest test-pp-str
  (testing "pp-str benchmark"
    (simple-benchmark []
                      (with-out-str (pprint/pprint onboarding))
                      10)
    (simple-benchmark []
                      (with-out-str (fipp/pprint onboarding))
                      10)
    (simple-benchmark []
                      (wfu/ugly-pr-str onboarding)
                      10)
    (simple-benchmark []
                      (pr-str onboarding)
                      10)
    ;; uncomment to see the output
    #_(println (wfu/ugly-pr-str onboarding))))
