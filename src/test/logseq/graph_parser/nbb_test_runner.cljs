(ns logseq.graph-parser.nbb-test-runner
  "Nbb tests for graph-parser"
  (:require [cljs.test :as t]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.text-test]
            [logseq.graph-parser.mldoc-test]
            [logseq.graph-parser.block-test]
            [logseq.graph-parser.property-test]
            [logseq.graph-parser.extract-test]
            [logseq.graph-parser-test]))

(defmethod cljs.test/report [:cljs.test/default :end-run-tests] [m]
  (when-not (cljs.test/successful? m)
    (set! (.-exitCode js/process) 1)))

;; run this function with: nbb-logseq -m logseq.test.nbb-test-runner/run-tests
(defn run-tests []
  ;; This hack is the same as the one in frontend.format. This has to be in an nbb only
  ;; ns since alter-var-root doesn't exist in cljs and nbb doesn't support set! yet
  #_:clj-kondo/ignore
  (alter-var-root #'gp-mldoc/parse-property (constantly text/parse-property))
  (t/run-tests 'logseq.graph-parser.mldoc-test
               'logseq.graph-parser.text-test
               'logseq.graph-parser.property-test
               'logseq.graph-parser.block-test
               'logseq.graph-parser.extract-test
               'logseq.graph-parser-test))
