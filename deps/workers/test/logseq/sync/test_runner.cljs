(ns logseq.sync.test-runner
  (:require [cljs.test :as ct]
            [logseq.sync.common-test]
            [logseq.sync.index-test]
            [logseq.sync.node-adapter-test]
            [logseq.sync.node-config-test]
            [logseq.sync.normalize-test]
            [logseq.sync.platform-test]
            [logseq.sync.worker-auth-test]
            [logseq.sync.worker-handler-assets-test]
            [logseq.sync.worker-handler-index-test]
            [logseq.sync.worker-handler-sync-test]
            [logseq.sync.worker-handler-ws-test]
            [logseq.sync.worker-routes-test]
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
