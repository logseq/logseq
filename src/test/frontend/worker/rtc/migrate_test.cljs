(ns frontend.worker.rtc.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.pprint :as pp]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [logseq.db :as ldb]))

(deftest ^:focus local-datoms-tx-data=>remote-tx-data-test
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        transact-result-coll (db-migrate/migrate "rtc-migrate-test" conn)]
    (pp/pprint (update transact-result-coll :transact-result-coll #(map :tx-data %)))
    (let [remote-tx-data (rtc-migrate/local-migrate-result-data=>remote-tx-data
                          (:transact-result-coll transact-result-coll))]
      ;; (pp/pprint (map :tx-data remote-tx-data))
      )))
