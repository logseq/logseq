(ns frontend.worker.rtc.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.pprint :as pp]
            [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [logseq.db :as ldb]))

(deftest ^:focus migration-results=>client-ops
  (testing "65.2 => 65.3"
    (let [db-transit (str (fs-node/readFileSync "src/test/migration/65.2.transit"))
          db (ldb/read-transit-str db-transit)
          conn (d/conn-from-db db)
          migration-result (db-migrate/migrate conn {:target-version "65.3"})
          client-ops (rtc-migrate/migration-results=>client-ops migration-result)]
      (prn :migration-result "================================================================")
      (pp/pprint (map (fn [r] [(:tx-data r) (select-keys (:migrate-updates r) [:rename-db-idents])])
                      (:upgrade-result-coll migration-result)))
      (prn :client-ops "================================================================")
      (pp/pprint client-ops)
      (testing "client-ops are generated correctly from migration-result"
        (is (seq client-ops) "Client ops should not be empty")

        (let [last-op (last client-ops)
              schema-version-update? (= :update-kv-value (first last-op))]
          (is schema-version-update? "The last op should be to update schema version")
          (when schema-version-update?
            (is (= :logseq.kv/schema-version (get-in last-op [2 :db-ident])) "The schema version key should be correct")
            (is (= (:to-version migration-result) (get-in last-op [2 :value])) "The schema version should be updated to the new version")))))))
