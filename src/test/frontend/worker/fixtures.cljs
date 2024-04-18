(ns frontend.worker.fixtures
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.undo-redo :as worker-undo-redo]))


(defn listen-test-db-to-gen-undo-ops-fixture
  [f]
  (let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
    (assert (some? test-db-conn))
    (worker-undo-redo/clear-undo-redo-stack)
    (worker-db-listener/listen-db-changes! test-helper/test-db-name-db-version test-db-conn
                                           {:handler-keys [:gen-undo-ops
                                                           ;; :sync-db-to-main-thread
                                                           ]})

    (f)
    (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!)))
