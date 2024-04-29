(ns frontend.worker.fixtures
  (:require ["fs" :as fs-node]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.db.sqlite.util :as sqlite-util]))


(defn listen-test-db-fixture
  [handler-keys]
  (fn [f]
    (let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)]
      (assert (some? test-db-conn))
      (worker-undo-redo/clear-undo-redo-stack)
      (worker-db-listener/listen-db-changes! test-helper/test-db-name-db-version test-db-conn
                                             {:handler-keys handler-keys})

      (f)
      (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!))))

(def ^:private *tx-log-name-index (atom 0))
(defn listen-test-db-to-write-tx-log-json-file
  "Write {:tx-log <tx-data-coll> :init-db <init-db>} to file 'tx-log-<index>.json'"
  [f]
  (let [test-db-conn (conn/get-db test-helper/test-db-name-db-version false)
        init-db @test-db-conn
        *tx-log (atom [])]
    (d/listen! test-db-conn :collect-tx-data
               (fn [{:keys [tx-data]}]
                 (swap! *tx-log conj tx-data)))
    (try
      (f)
      (finally
        (let [file-name (str "tx-log-" @*tx-log-name-index ".json")]
          (println "saving " file-name " ...")
          (fs-node/writeFileSync file-name (sqlite-util/write-transit-str {:tx-log @*tx-log :init-db init-db}))
          (swap! *tx-log-name-index inc))))
    (d/unlisten! test-db-conn :collect-tx-data)))
