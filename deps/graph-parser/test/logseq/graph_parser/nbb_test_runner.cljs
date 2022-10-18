(ns logseq.graph-parser.nbb-test-runner
  "Nbb tests for graph-parser"
  (:require [cljs.test :as t]
            [logseq.graph-parser.text-test]
            [logseq.graph-parser.mldoc-test]
            [logseq.graph-parser.block-test]
            [logseq.graph-parser.property-test]
            [logseq.graph-parser.extract-test]
            [logseq.graph-parser.cli-test]
            [logseq.graph-parser.util.page-ref-test]
            [logseq.graph-parser.util-test]
            [logseq.graph-parser.util.file-name-test]
            [logseq.graph-parser-test]))

(defmethod t/report [:cljs.test/default :end-run-tests] [m]
  (when-not (t/successful? m)
    (set! (.-exitCode js/process) 1)))

;; run this function with: nbb-logseq -m logseq.test.nbb-test-runner/run-tests
(defn run-tests []
  (t/run-tests
   'logseq.graph-parser.mldoc-test
   'logseq.graph-parser.text-test
   'logseq.graph-parser.property-test
   'logseq.graph-parser.block-test
   'logseq.graph-parser.extract-test
   'logseq.graph-parser.cli-test
   'logseq.graph-parser.util.page-ref-test
   'logseq.graph-parser-test
   'logseq.graph-parser.util.file-name-test
   'logseq.graph-parser.util-test))
