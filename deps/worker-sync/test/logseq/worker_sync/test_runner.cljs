(ns logseq.worker-sync.test-runner
  (:require [cljs.test :as ct]
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
