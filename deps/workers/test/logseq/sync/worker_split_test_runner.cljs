(ns logseq.sync.worker-split-test-runner
  (:require [cljs.test :as ct]
            [logseq.agents.dispatch-test]
            [logseq.sync.worker-test]
            [shadow.test :as st]
            [shadow.test.env :as env]))

(derive ::node ::ct/default)

(defmethod ct/report [::node :end-run-tests] [m]
  (if (ct/successful? m)
    (js/process.exit 0)
    (js/process.exit 1)))

(defn ^:dev/after-load reset-test-data! []
  (when-let [test-data (env/get-test-data)]
    (env/reset-test-data! test-data)))

(defn main [& _args]
  (reset-test-data!)
  (let [test-env (ct/empty-env ::node)]
    (st/run-all-tests test-env nil)))
