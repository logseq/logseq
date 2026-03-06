(ns frontend.worker.sync.client-op-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]))

(deftest update-graph-uuid-replaces-existing-value-test
  (let [repo "repo-1"
        conn (d/create-conn client-op/schema-in-db)
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {repo conn})
    (try
      (client-op/update-graph-uuid repo "graph-1")
      (client-op/update-graph-uuid repo "graph-2")
      (let [graph-uuid-datoms (vec (d/datoms @conn :avet :graph-uuid))]
        (is (= 1 (count graph-uuid-datoms)))
        (is (= #{"graph-2"} (set (map :v graph-uuid-datoms)))))
      (finally
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))
