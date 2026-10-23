(ns logseq.db-sync.tx-sanitize-mutation2-test
  "Tests for survivors of the second mutation run on logseq.db-sync.tx-sanitize."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.tx-sanitize :as tx-sanitize]
            [logseq.db.test.helper :as db-test]))

;; Fails if, in `entity-op-kinds`, `:db/cas` becomes `:db/id` or `:db.fn/cas` becomes `:db.fn/retractEntity`.
(deftest entity-op-kinds-test
  (testing "ops on an entity attribute"
    (doseq [op [:db/add :db/retract :db/cas :db.fn/cas]]
      (is (true? (#'tx-sanitize/entity-op? [op 1 :a 1 2])) (str op))))
  (testing "other operations are not entity ops"
    (is (false? (#'tx-sanitize/entity-op? [:db.fn/retractEntity 1 :a 2])))
    (is (false? (#'tx-sanitize/entity-op? [:db/retractEntity 1 :a 2])))
    (is (false? (#'tx-sanitize/entity-op? [:db/id 1 :a 2])))))

;; Fails if, in `ignored-kv-entity-ref?`, `:db/ident` becomes `:db/retract`.
;; Fails if, in `ignored-kv-entity-op?`, `:db/id` becomes `:db/ident`.
(deftest sanitize-tx-drops-ops-on-an-existing-ignored-kv-entity-by-eid-test
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [{:db/ident :logseq.kv/graph-backup-folder
                              :logseq.kv/value "/old"}])
        eid (d/entid @conn :logseq.kv/graph-backup-folder)
        block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        kept [:db/add [:block/uuid block-uuid] :block/title "remote title"]
        ignored-ops [[:db/add eid :logseq.kv/value "/tmp/a"]
                     {:db/id eid :logseq.kv/value "/tmp/b"}
                     [:db/retractEntity eid]]
        sanitized (tx-sanitize/sanitize-tx @conn (conj ignored-ops kept))]
    (is (pos? eid))
    (is (= [kept] (vec sanitized)))))

;; Fails if, in `bookkeeping-attrs`, `:block/created-at` becomes `:block/name`, `:block/updated-at` becomes `:block/uuid` or `:block/order` becomes `:block/path-refs`.
(deftest sanitize-tx-drops-stamps-on-missing-entities-test
  (let [conn (db-test/create-conn)
        missing 99999999
        stamps [[:db/add missing :block/created-at 1]
                [:db/add missing :block/updated-at 2]
                [:db/add missing :block/order "a0"]]
        kept [[:db/add missing :block/title "x"]
              [:db/add missing :block/name "x"]]
        sanitized (tx-sanitize/sanitize-tx @conn (into stamps kept))]
    (is (= kept (vec sanitized)))))

;; Fails if, in `encrypted-attrs`, `:block/name` becomes `:block/order`.
(deftest sanitize-tx-drops-conflicted-encrypted-retracts-test
  (let [conn (db-test/create-conn)
        block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        ref [:block/uuid block-uuid]]
    (doseq [attr [:block/title :block/name]]
      (let [add [:db/add ref attr "same"]
            sanitized (tx-sanitize/sanitize-tx @conn [[:db/retract ref attr "same"] add])]
        (is (= [add] (vec sanitized)) (str attr))))
    (testing "a retract with a different value stays"
      (let [retract [:db/retract ref :block/name "old"]
            add [:db/add ref :block/name "new"]]
        (is (= [retract add] (vec (tx-sanitize/sanitize-tx @conn [retract add]))))))))

(defn- descendants-fixture
  []
  (let [conn (db-test/create-conn)
        page (random-uuid)
        parent (random-uuid)
        child (random-uuid)
        pv (random-uuid)
        bare-parent (random-uuid)
        bare-child (random-uuid)
        now 1783043128375]
    (d/transact! conn [{:block/uuid page :block/name "p" :block/title "p"
                        :block/created-at now :block/updated-at now}
                       {:block/uuid parent :block/title "parent"
                        :block/parent [:block/uuid page] :block/page [:block/uuid page]
                        :block/order "a0" :block/created-at now :block/updated-at now}
                       {:block/uuid child :block/title "child"
                        :block/parent [:block/uuid parent] :block/page [:block/uuid page]
                        :block/order "a1" :block/created-at now :block/updated-at now}
                       {:block/uuid pv :block/title "pv"
                        :block/parent [:block/uuid child] :block/page [:block/uuid page]
                        :block/order "a2" :block/created-at now :block/updated-at now}
                       ;; no :block/created-at
                       {:block/uuid bare-parent :block/title "bare parent"
                        :block/parent [:block/uuid page] :block/page [:block/uuid page]
                        :block/order "a3"}
                       {:block/uuid bare-child :block/title "bare child"
                        :block/parent [:block/uuid bare-parent] :block/page [:block/uuid page]
                        :block/order "a4"}])
    (let [db @conn
          eid (fn [u] (d/entid db [:block/uuid u]))]
      {:db db
       :parent-eid (eid parent) :child-eid (eid child) :pv-eid (eid pv)
       :child-uuid child
       :bare-parent-eid (eid bare-parent) :bare-child-eid (eid bare-child)})))

;; Fails if, in `touched-entity-eid`, `:db/id` becomes `:db/ident` or `:block/uuid` becomes `:block/created-at`.
(deftest sanitize-tx-preserves-touched-descendants-of-a-retracted-block-test
  (let [{:keys [db parent-eid child-eid pv-eid child-uuid]} (descendants-fixture)
        retract-of (fn [eid] [:db/retractEntity eid])
        sanitize (fn [touch]
                   (tx-sanitize/sanitize-tx db (cond-> [[:db/retractEntity parent-eid]]
                                                 touch (conj touch))))]
    (testing "an untouched descendant is retracted along"
      (let [out (sanitize nil)]
        (is (some #{(retract-of child-eid)} out))
        (is (some #{(retract-of pv-eid)} out))))
    (testing "descendants touched by the tx stay"
      (doseq [[label touch] [["map by :db/id" {:db/id child-eid :block/title "x"}]
                             ["map by :block/uuid" {:block/uuid child-uuid :block/title "x"}]
                             ["add by eid" [:db/add child-eid :block/title "x"]]]]
        (let [out (sanitize touch)]
          (is (not-any? #{(retract-of child-eid)} out) label)
          (is (some #{(retract-of pv-eid)} out) label))))))

;; Fails if, in `sanitize-tx`, the `set` step is dropped.
(deftest sanitize-tx-preserves-a-descendant-touched-by-several-ops-test
  (let [{:keys [db parent-eid child-eid pv-eid]} (descendants-fixture)
        out (tx-sanitize/sanitize-tx db [[:db/retractEntity parent-eid]
                                         [:db/add child-eid :block/title "x"]
                                         [:db/add child-eid :block/order "a5"]])]
    (is (not-any? #{[:db/retractEntity child-eid]} out))
    (is (some #{[:db/retractEntity pv-eid]} out))))

;; Fails if, in `sanitize-tx`, `:block/uuid` becomes `:block/created-at`.
(deftest sanitize-tx-retracts-children-of-a-retracted-block-with-uuid-test
  (let [{:keys [db bare-parent-eid bare-child-eid]} (descendants-fixture)
        out (tx-sanitize/sanitize-tx db [[:db/retractEntity bare-parent-eid]])]
    (is (some #{[:db/retractEntity bare-child-eid]} out))))
