(ns logseq.tasks.test-runner
  (:require [cljs.test :as test]
            [logseq.tasks.db-graph.create-graph-with-large-sizes-test]))

(defn -main [& _]
  (let [{:keys [fail error]} (test/run-tests 'logseq.tasks.db-graph.create-graph-with-large-sizes-test)]
    (when (pos? (+ fail error))
      (js/process.exit 1))))
