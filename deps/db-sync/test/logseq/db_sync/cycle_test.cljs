(ns logseq.db-sync.cycle-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db-sync.cycle :as cycle]))

(defn- new-conn []
  (d/create-conn db-schema/schema))

(deftest block-parent-cycle-test
  (let [conn (new-conn)
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a}
                       {:block/uuid b :block/parent [:block/uuid a]}
                       {:block/uuid c :block/parent [:block/uuid b]}])
    (testing "detects a parent cycle"
      (let [tx [{:block/uuid a :block/parent [:block/uuid c]}]
            result (cycle/detect-cycle @conn tx)]
        (is (= :block/parent (:attr result)))))
    (testing "accepts a non-cycle update"
      (let [tx [{:block/uuid c :block/parent [:block/uuid a]}]
            result (cycle/detect-cycle @conn tx)]
        (is (nil? result))))))

(deftest class-extends-cycle-test
  (let [conn (new-conn)]
    (d/transact! conn [{:db/ident :user.class/A :logseq.property.class/extends :user.class/B}
                       {:db/ident :user.class/B :logseq.property.class/extends :user.class/C}
                       {:db/ident :user.class/C}])
    (let [tx [{:db/ident :user.class/C :logseq.property.class/extends :user.class/A}]
          result (cycle/detect-cycle @conn tx)]
      (is (= :logseq.property.class/extends (:attr result))))))

(deftest server-values-test
  (let [conn (new-conn)
        a (random-uuid)
        b (random-uuid)]
    (d/transact! conn [{:block/uuid a}
                       {:block/uuid b :block/parent [:block/uuid a]}])
    (let [tx [{:block/uuid b :block/parent [:block/uuid b]}]
          values (cycle/server-values-for @conn tx :block/parent)]
      (is (= {(pr-str [:block/uuid b]) [:block/uuid a]} values)))))

(deftest numeric-entity-cycle-test
  (let [conn (new-conn)
        a (random-uuid)
        b (random-uuid)]
    (d/transact! conn [{:block/uuid a}
                       {:block/uuid b :block/parent [:block/uuid a]}])
    (let [a-eid (d/entid @conn [:block/uuid a])
          tx [[:db/add a-eid :block/parent [:block/uuid b]]]
          result (cycle/detect-cycle @conn tx)]
      (is (= :block/parent (:attr result)))
      (is (= [:block/uuid a] (:entity result))))))

(deftest three-block-cycle-test
  (let [conn (new-conn)
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a}
                       {:block/uuid b :block/parent [:block/uuid a]}
                       {:block/uuid c :block/parent [:block/uuid b]}])
    (let [a-eid (d/entid @conn [:block/uuid a])
          tx [[:db/add a-eid :block/parent [:block/uuid c]]]
          result (cycle/detect-cycle @conn tx)]
      (is (= :block/parent (:attr result)))
      (is (= [:block/uuid a] (:entity result))))))
