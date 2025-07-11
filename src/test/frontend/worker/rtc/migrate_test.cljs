(ns frontend.worker.rtc.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is testing]]
            [logseq.db :as ldb]
            [frontend.worker.db.migrate :as db-migrate]
            [datascript.core :as d]
            [cljs.pprint :as pp]))

(deftest ^:focus local-datoms-tx-data=>remote-tx-data-test
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        tx-data-coll (db-migrate/migrate "rtc-migrate-test" conn)]
    (pp/pprint tx-data-coll)))
