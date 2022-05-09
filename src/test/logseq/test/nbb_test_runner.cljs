(ns logseq.test.nbb-test-runner
  (:require [cljs.test :as t]
            [logseq.graph-parser.mldoc-test]))

(defmethod cljs.test/report [:cljs.test/default :end-run-tests] [m]
  (when-not (cljs.test/successful? m)
    (set! (.-exitCode js/process) 1)))

;; run this function with: nbb-logseq -m logseq.test.nbb-test-runner/run-tests
(defn run-tests []
  (t/run-tests 'logseq.graph-parser.mldoc-test))
