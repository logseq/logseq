(ns frontend.worker.rtc.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.pprint :as pp]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [logseq.db :as ldb]))

(deftest ^:focus migration-results=>client-ops
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        migration-result (db-migrate/migrate conn)
        client-ops (rtc-migrate/migration-results=>client-ops migration-result)]
    (pp/pprint client-ops)))
