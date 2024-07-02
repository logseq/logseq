(ns frontend.worker.rtc.fixture
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]))

(def listen-test-db-to-gen-rtc-ops-fixture
  {:before
   #(let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
      (assert (some? test-db-conn))
      (worker-db-listener/listen-db-changes! test-helper/test-db-name-db-version test-db-conn
                                             {:handler-keys [:gen-rtc-ops]}))
   :after
   #(when-let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
      (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!))})

(def clear-op-mem-stores-fixture
  {:before #(do (op-mem-layer/remove-ops-store! test-helper/test-db-name-db-version)
                (op-mem-layer/init-empty-ops-store! test-helper/test-db-name-db-version))
   :after #(op-mem-layer/remove-ops-store! test-helper/test-db-name-db-version)})
