(ns frontend.worker.rtc.fixture
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.state :as worker-state]))

(def listen-test-db-to-gen-rtc-ops-fixture
  {:before
   #(let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
      (assert (some? test-db-conn))
      (worker-db-listener/listen-db-changes! test-helper/test-db-name-db-version test-db-conn
                                             {:handler-keys [:gen-rtc-ops]})
      (swap! worker-state/*client-ops-conns
             assoc test-helper/test-db-name-db-version (d/create-conn client-op/schema-in-db)))
   :after
   #(when-let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
      (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!)
      (swap! worker-state/*client-ops-conns dissoc test-helper/test-db-name-db-version))})
