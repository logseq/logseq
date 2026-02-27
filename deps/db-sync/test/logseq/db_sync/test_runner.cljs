(ns logseq.db-sync.test-runner
  (:require [cljs.test :as ct]
            [logseq.db-sync.common-test]
            [logseq.db-sync.index-test]
            [logseq.db-sync.node-adapter-test]
            [logseq.db-sync.node-config-test]
            [logseq.db-sync.node-server-test]
            [logseq.db-sync.normalize-test]
            [logseq.db-sync.platform-test]
            [logseq.db-sync.worker-auth-test]
            [logseq.db-sync.worker-handler-assets-test]
            [logseq.db-sync.worker-handler-index-test]
            [logseq.db-sync.worker-handler-sync-test]
            [logseq.db-sync.worker-handler-ws-test]
            [shadow.test :as st]
            [shadow.test.env :as env]))

(derive ::node ::ct/default)

(defmethod ct/report [::node :end-run-tests] [m]
  (if (ct/successful? m)
    (js/process.exit 0)
    (js/process.exit 1)))

(defn ^:dev/after-load reset-test-data! []
  (-> (env/get-test-data)
      (env/reset-test-data!)))

(defn main [& _args]
  (reset-test-data!)
  (let [test-env (ct/empty-env ::node)]
    (st/run-all-tests test-env nil)))
