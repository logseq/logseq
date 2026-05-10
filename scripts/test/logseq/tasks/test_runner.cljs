(ns logseq.tasks.test-runner
  (:require [cljs.test :as test]
            [logseq.tasks.db-graph.create-graph-with-clojure-irc-history-test]
            [logseq.tasks.db-graph.create-graph-with-large-sizes-test]
            [logseq.tasks.ios-build-config-test]
            [logseq.tasks.lang-test]
            [logseq.tasks.util-test]))

(defn -main [& _]
  (let [{:keys [fail error]}
        (test/run-tests 'logseq.tasks.db-graph.create-graph-with-large-sizes-test
                        'logseq.tasks.db-graph.create-graph-with-clojure-irc-history-test
                        'logseq.tasks.ios-build-config-test
                        'logseq.tasks.lang-test
                        'logseq.tasks.util-test)]
    (when (pos? (+ fail error))
      (js/process.exit 1))))
