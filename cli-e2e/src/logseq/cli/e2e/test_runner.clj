(ns logseq.cli.e2e.test-runner
  (:require [clojure.test :as test]))

(def test-namespaces
  '[logseq.cli.e2e.coverage-test
    logseq.cli.e2e.preflight-test
    logseq.cli.e2e.shell-test
    logseq.cli.e2e.runner-test
    logseq.cli.e2e.cleanup-test
    logseq.cli.e2e.main-test])

(defn run!
  [_opts]
  (doseq [ns-sym test-namespaces]
    (require ns-sym))
  (let [{:keys [fail error]} (apply test/run-tests test-namespaces)]
    (when (pos? (+ fail error))
      (throw (ex-info "cli-e2e unit tests failed"
                      {:fail fail
                       :error error})))))
