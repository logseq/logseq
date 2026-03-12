(ns frontend.test.frontend-node-test-runner
  "This is a custom version of the node-test-runner for the frontend build"
  {:dev/always true} ;; necessary for test-data freshness
  (:require ;; activate humane test output for all tests
   #_[pjstadig.humane-test-output]
   [frontend.test.node-test-runner :as node-test-runner]
   [shadow.test.env :as env]))

;; Needed for new test runners
(defn ^:dev/after-load reset-test-data! []
  (-> (env/get-test-data)
      (env/reset-test-data!)))

(defn main [& args]
  []
  (reset-test-data!)
  (node-test-runner/parse-and-run-tests args))
