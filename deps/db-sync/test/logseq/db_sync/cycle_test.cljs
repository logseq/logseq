(ns logseq.db-sync.cycle-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.cycle :as cycle]
            [logseq.db.test.helper :as db-test]))

(defn- new-conn []
  (db-test/create-conn))

(defn- fix-cycle!
  [temp-conn remote-tx-report rebase-tx-report]
  (let [tx-metas (atom [])]
    (cycle/fix-cycle! temp-conn remote-tx-report rebase-tx-report
                      {:transact! (fn [conn tx-data tx-meta]
                                    (swap! tx-metas conj tx-meta)
                                    (d/transact! conn tx-data tx-meta))})
    @tx-metas))

(defn- create-page!
  [conn title]
  (let [page-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name title
                        :block/title title}])
    page-uuid))

(defn- block-eid
  [db uuid]
  (d/entid db [:block/uuid uuid]))

(deftest block-parent-2-node-cycle-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "page")
        a (random-uuid)
        b (random-uuid)]
    (d/transact! conn [{:block/uuid a
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid b
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid a]}])
    (testing "breaks a 2-node :block/parent cycle and reparents to the page"
      (let [remote-report (d/transact! conn [{:block/uuid a :block/parent [:block/uuid b]}])
            tx-metas (fix-cycle! conn remote-report nil)
            a' (d/entity @conn [:block/uuid a])
            b' (d/entity @conn [:block/uuid b])]
        (is (= (block-eid @conn page-uuid) (:db/id (:block/parent a'))))
        (is (= (block-eid @conn a) (:db/id (:block/parent b'))))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest block-parent-3-node-cycle-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "page")
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid b
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid a]}
                       {:block/uuid c
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid b]}])
    (testing "breaks a 3-node :block/parent cycle and reparents to the page"
      (let [remote-report (d/transact! conn [{:block/uuid a :block/parent [:block/uuid c]}])
            tx-metas (fix-cycle! conn remote-report nil)]
        (let [a' (d/entity @conn [:block/uuid a])
              b' (d/entity @conn [:block/uuid b])
              c' (d/entity @conn [:block/uuid c])]
          (is (= (block-eid @conn page-uuid) (:db/id (:block/parent a'))))
          (is (= (block-eid @conn a) (:db/id (:block/parent b'))))
          (is (= (block-eid @conn b) (:db/id (:block/parent c')))))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest block-parent-cycle-prefers-remote-parent-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "page")
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid b
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid c
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}])
    (testing "prefers remote parent when breaking local cycle"
      (let [remote-report (d/transact! conn [{:block/uuid b :block/parent [:block/uuid c]}
                                             {:block/uuid a :block/parent [:block/uuid b]}])
            rebase-report (d/transact! conn [{:block/uuid b :block/parent [:block/uuid a]}
                                             {:block/uuid c :block/parent [:block/uuid b]}])
            tx-metas (fix-cycle! conn remote-report rebase-report)
            a' (d/entity @conn [:block/uuid a])
            b' (d/entity @conn [:block/uuid b])
            c' (d/entity @conn [:block/uuid c])]
        (is (= (block-eid @conn b) (:db/id (:block/parent a'))))
        (is (= (block-eid @conn c) (:db/id (:block/parent b'))))
        (is (= (block-eid @conn page-uuid) (:db/id (:block/parent c'))))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest block-parent-cycle-avoids-descendant-remote-parent-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "page")
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid b
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid a]}
                       {:block/uuid c
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid b]}])
    (testing "falls back to page when remote parent is a descendant"
      (let [remote-report (d/transact! conn [{:block/uuid b :block/parent [:block/uuid c]}])
            rebase-report (d/transact! conn [{:block/uuid a :block/parent [:block/uuid b]}])
            tx-metas (fix-cycle! conn remote-report rebase-report)
            a' (d/entity @conn [:block/uuid a])
            b' (d/entity @conn [:block/uuid b])
            c' (d/entity @conn [:block/uuid c])]
        (is (= (block-eid @conn page-uuid) (:db/id (:block/parent b'))))
        (is (= (block-eid @conn b) (:db/id (:block/parent a'))))
        (is (= (block-eid @conn b) (:db/id (:block/parent c'))))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest block-parent-cycle-preserves-safe-remote-edges-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "page")
        a (random-uuid)
        b (random-uuid)
        c (random-uuid)]
    (d/transact! conn [{:block/uuid a
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}
                       {:block/uuid b
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid a]}
                       {:block/uuid c
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid b]}])
    (testing "preserves remote parent when it doesn't reintroduce a cycle"
      (let [remote-report (d/transact! conn [{:block/uuid b :block/parent [:block/uuid c]}
                                             {:block/uuid a :block/parent [:block/uuid b]}])
            rebase-report (d/transact! conn [{:block/uuid b :block/parent [:block/uuid a]}
                                             {:block/uuid c :block/parent [:block/uuid b]}])
            tx-metas (fix-cycle! conn remote-report rebase-report)
            a' (d/entity @conn [:block/uuid a])
            b' (d/entity @conn [:block/uuid b])
            c' (d/entity @conn [:block/uuid c])]
        (is (= (block-eid @conn b) (:db/id (:block/parent a'))))
        (is (= (block-eid @conn page-uuid) (:db/id (:block/parent b'))))
        (is (= (block-eid @conn b) (:db/id (:block/parent c'))))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest class-extends-2-node-cycle-test
  (let [conn (new-conn)]
    (d/transact! conn [{:db/ident :logseq.class/Root}
                       {:db/ident :user.class/B}
                       {:db/ident :user.class/A :logseq.property.class/extends :user.class/B}])
    (testing "breaks a 2-node :logseq.property.class/extends cycle"
      (let [remote-report (d/transact! conn [{:db/ident :user.class/B
                                              :logseq.property.class/extends :user.class/A}])
            tx-metas (fix-cycle! conn remote-report nil)]
        (let [b (d/entity @conn :user.class/B)
              _ (prn :debug :extends (:logseq.property.class/extends b))
              extends (set (map :db/ident (:logseq.property.class/extends b)))]
          (is (not (contains? extends :user.class/A)))
          (is (contains? extends :logseq.class/Root)))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest class-extends-3-node-cycle-with-multiple-values-test
  (let [conn (new-conn)]
    (d/transact! conn [{:db/ident :logseq.class/Root}
                       {:db/ident :user.class/C}
                       {:db/ident :user.class/D}
                       {:db/ident :user.class/B :logseq.property.class/extends :user.class/C}
                       {:db/ident :user.class/A :logseq.property.class/extends :user.class/B}])
    (testing "breaks a 3-node :logseq.property.class/extends cycle while preserving other extends"
      (let [remote-report (d/transact! conn [{:db/ident :user.class/C
                                              :logseq.property.class/extends #{:user.class/A :user.class/D}}])
            tx-metas (fix-cycle! conn remote-report nil)]
        (let [c (d/entity @conn :user.class/C)
              extends (set (map :db/ident (:logseq.property.class/extends c)))]
          (is (not (contains? extends :user.class/A)))
          (is (contains? extends :user.class/D))
          (is (contains? extends :logseq.class/Root)))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))

(deftest class-extends-cycle-prefers-remote-set-test
  (let [conn (new-conn)]
    (d/transact! conn [{:db/ident :logseq.class/Root}
                       {:db/ident :user.class/B}
                       {:db/ident :user.class/A :logseq.property.class/extends :logseq.class/Root}])
    (testing "prefers remote extends set when breaking cycles"
      (let [remote-report (d/transact! conn [{:db/ident :user.class/B
                                              :logseq.property.class/extends :user.class/A}])
            rebase-report (d/transact! conn [{:db/ident :user.class/A
                                              :logseq.property.class/extends :user.class/B}])
            tx-metas (fix-cycle! conn remote-report rebase-report)]
        (let [a (d/entity @conn :user.class/A)
              b (d/entity @conn :user.class/B)
              extends-a (set (map :db/ident (:logseq.property.class/extends a)))
              extends-b (set (map :db/ident (:logseq.property.class/extends b)))]
          (is (not (contains? extends-a :user.class/B)))
          (is (contains? extends-a :logseq.class/Root))
          (is (contains? extends-b :user.class/A)))
        (is (some #(= :fix-cycle (:outliner-op %)) tx-metas))
        (is (every? #(false? (:gen-undo-ops? %)) tx-metas))
        (is (every? #(false? (:persist-op? %)) tx-metas))))))
