(ns frontend.worker.rtc.migrate-test
  (:require ["fs" :as fs-node]
            ;; [cljs.pprint :as pp]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]))

(defn- get-specific-result
  [upgrade-result-coll version]
  (let [parsed-version (db-schema/parse-schema-version version)]
    (some (fn [{:keys [tx-data] :as upgrade-result}]
            (when (some (fn [datom]
                          (and (= :kv/value (:a datom))
                               (= parsed-version (db-schema/parse-schema-version (:v datom)))))
                        tx-data)
              upgrade-result))
          upgrade-result-coll)))

(deftest migration-results=>client-ops
  (testing "65.2 => 65.11"
    (let [db-transit (str (fs-node/readFileSync "src/test/migration/65.2.transit"))
          db (ldb/read-transit-str db-transit)
          conn (d/conn-from-db db)
          migration-result (db-migrate/migrate conn {:target-version "65.11"})
          client-ops (rtc-migrate/migration-results=>client-ops migration-result)]
      ;; (prn :migration-result "================================================================")
      ;; (pp/pprint (merge (select-keys migration-result [:from-version :to-version])
      ;;                   {:upgrade-result-coll
      ;;                    (map (fn [r] [(:tx-data r) (select-keys (:migrate-updates r) [:rename-db-idents])])
      ;;                         (:upgrade-result-coll migration-result))}))
      ;; (prn :client-ops "================================================================")
      ;; (pp/pprint client-ops)
      (testing "check schema-version"
        (let [last-op (last client-ops)
              schema-version-update? (= :update-kv-value (first last-op))]
          (is schema-version-update? "The last op should be to update schema version")
          (when schema-version-update?
            (is (= :logseq.kv/schema-version (get-in last-op [2 :db-ident])) "The schema version key should be correct")
            (is (= (:to-version migration-result) (get-in last-op [2 :value])) "The schema version should be updated to the new version"))))

      (testing "check 65.3"
        (let [upgrade-result-65-3 (get-specific-result (:upgrade-result-coll migration-result) "65.3")
              rename-db-idents (set (:rename-db-idents (:migrate-updates upgrade-result-65-3)))
              rename-db-ident-op-values (set (keep (fn [op] (when (= :rename-db-ident (first op)) (last op))) client-ops))]
          (is (some? upgrade-result-65-3))
          (is (= rename-db-idents rename-db-ident-op-values))))

      (testing "check 65.10"
        (let [upgrade-result-65-10 (get-specific-result (:upgrade-result-coll migration-result) "65.10")
              {:keys [tx-data db-after]} upgrade-result-65-10]
          (is (some? upgrade-result-65-10))
          (let [tx-id-65-10 (:tx (first tx-data))
                ents (map (partial d/entity db-after)
                          (set (keep (fn [datom] (when (:added datom) (:e datom))) tx-data)))
                block-uuids-in-tx-data (set (keep :block/uuid ents))
                block-uuids-in-client-ops (set
                                           (keep
                                            (fn [[op tx-id value]]
                                              (when (and (= tx-id tx-id-65-10)
                                                         (contains? #{:update :update-page :move} op))
                                                (:block-uuid value)))
                                            client-ops))]
            (is (= block-uuids-in-tx-data block-uuids-in-client-ops))))))))
