(ns logseq.db-sync.normalize-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.test.helper :as db-test]))

(defn- new-conn []
  (db-test/create-conn))

(defn- create-page!
  [conn title]
  (let [page-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name title
                        :block/title title}])
    page-uuid))

(defn- op-e-a-v
  [datom]
  (subvec (vec datom) 0 4))

(defn- tx-touches-uuid?
  [tx-data block-uuid]
  (let [lookup [:block/uuid block-uuid]
        block-uuid-str (str block-uuid)]
    (boolean
     (some (fn [item]
             (let [item (vec item)]
               (case (count item)
                 5 (or (= lookup (nth item 1))
                       (= block-uuid-str (nth item 1))
                       (= block-uuid (nth item 3)))
                 2 (or (= lookup (second item))
                       (= block-uuid-str (second item)))
                 false)))
           tx-data))))

(defn- seeded-rng
  [seed0]
  (let [state (atom (bit-or (long seed0) 0))]
    (fn []
      (let [s (swap! state
                     (fn [x]
                       (let [x (bit-xor x (bit-shift-left x 13))
                             x (bit-xor x (bit-shift-right x 17))
                             x (bit-xor x (bit-shift-left x 5))]
                         (bit-or x 0))))]
        (/ (double (unsigned-bit-shift-right s 0)) 4294967296.0)))))

(defn- rand-int*
  [rng n]
  (js/Math.floor (* (rng) n)))

(defn- pick-rand
  [rng coll]
  (when (seq coll)
    (nth coll (rand-int* rng (count coll)))))

(defn- normal-block-uuids
  [db]
  (->> (d/datoms db :avet :block/uuid)
       (map :e)
       distinct
       (keep (fn [eid]
               (let [ent (d/entity db eid)]
                 (when (and (uuid? (:block/uuid ent))
                            (not (ldb/built-in? ent))
                            (nil? (:block/name ent))
                            (some? (:block/page ent)))
                   (:block/uuid ent)))))
       vec))

(defn- page-uuid
  [db]
  (some (fn [{:keys [e]}]
          (let [ent (d/entity db e)]
            (when (and (uuid? (:block/uuid ent))
                       (not (ldb/built-in? ent))
                       (string? (:block/name ent)))
              (:block/uuid ent))))
        (d/datoms db :avet :block/uuid)))

(defn- block-state
  [db]
  (->> (d/datoms db :avet :block/uuid)
       (map :e)
       distinct
       (keep (fn [eid]
               (let [ent (d/entity db eid)]
                 (when (and (uuid? (:block/uuid ent))
                            (not (ldb/built-in? ent))
                            (or (string? (:block/name ent))
                                (some? (:block/page ent))))
                   [(:block/uuid ent)
                    {:block/uuid (:block/uuid ent)
                     :block/name (:block/name ent)
                     :block/title (:block/title ent)
                     :block/page (some-> ent :block/page :block/uuid)
                     :block/parent (some-> ent :block/parent :block/uuid)
                     :block/order (:block/order ent)}]))))
       (into (sorted-map))))

(deftest normalize-tx-data-keeps-title-retract-without-replacement-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "Page")
        tx-report (d/transact! conn [[:db/retract [:block/uuid page-uuid] :block/title "Page"]])
        normalized (db-normalize/normalize-tx-data (:db-after tx-report)
                                                   (:db-before tx-report)
                                                   (:tx-data tx-report))
        tx-data (mapv op-e-a-v normalized)]
    (testing "keeps :block/title retract when no replacement title exists in same tx"
      (is (= [[:db/retract [:block/uuid page-uuid] :block/title "Page"]]
             tx-data)))))

(deftest normalize-tx-data-drops-title-retract-when-replaced-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "Page")
        tx-report (d/transact! conn [{:block/uuid page-uuid
                                      :block/title "Page 2"}])
        normalized (db-normalize/normalize-tx-data (:db-after tx-report)
                                                   (:db-before tx-report)
                                                   (:tx-data tx-report))
        tx-data (mapv op-e-a-v normalized)]
    (testing "drops old :block/title retract and keeps new add during title update"
      (is (some #(= [:db/add [:block/uuid page-uuid] :block/title "Page 2"] %) tx-data))
      (is (not-any? #(= [:db/retract [:block/uuid page-uuid] :block/title "Page"] %) tx-data)))))

(deftest normalize-tx-data-keeps-recreated-normal-blocks-test
  (testing "retract + recreate for normal blocks should not drop recreated entity datoms"
    (let [conn (new-conn)
          page-uuid (create-page! conn "Page")
          target-uuid (random-uuid)
          sibling-uuid (random-uuid)
          child-uuid (random-uuid)
          _ (d/transact! conn [{:block/uuid target-uuid
                                :block/title "old-target"
                                :block/page [:block/uuid page-uuid]
                                :block/parent [:block/uuid page-uuid]
                                :block/order "a0"}
                               {:block/uuid sibling-uuid
                                :block/title "sibling"
                                :block/page [:block/uuid page-uuid]
                                :block/parent [:block/uuid page-uuid]
                                :block/order "a1"}
                               {:block/uuid child-uuid
                                :block/title "child"
                                :block/page [:block/uuid page-uuid]
                                :block/parent [:block/uuid target-uuid]
                                :block/order "a0"}])
          db-before @conn

          ;; Shape A: retract then recreate with tempid + explicit :block/uuid add.
          tx-report-a (d/with db-before
                              [[:db/retractEntity [:block/uuid target-uuid]]
                               [:db/add -1 :block/uuid target-uuid]
                               [:db/add -1 :block/title "new-target-a"]
                               [:db/add -1 :block/page [:block/uuid page-uuid]]
                               [:db/add -1 :block/parent [:block/uuid page-uuid]]
                               [:db/add -1 :block/order "a0"]
                               [:db/add [:block/uuid sibling-uuid] :block/title "sibling-2"]]
                              {})
          normalized-a (db-normalize/normalize-tx-data (:db-after tx-report-a)
                                                       (:db-before tx-report-a)
                                                       (:tx-data tx-report-a))

          ;; Shape B: same recreate, plus child reparent to recreated target.
          tx-report-b (d/with db-before
                              [[:db/retractEntity [:block/uuid target-uuid]]
                               [:db/add -1 :block/uuid target-uuid]
                               [:db/add -1 :block/title "new-target-b"]
                               [:db/add -1 :block/page [:block/uuid page-uuid]]
                               [:db/add -1 :block/parent [:block/uuid page-uuid]]
                               [:db/add -1 :block/order "a2"]
                               [:db/add [:block/uuid child-uuid] :block/parent [:block/uuid target-uuid]]
                               [:db/add [:block/uuid sibling-uuid] :block/title "sibling-3"]]
                              {})
          normalized-b (db-normalize/normalize-tx-data (:db-after tx-report-b)
                                                       (:db-before tx-report-b)
                                                       (:tx-data tx-report-b))]
      (is (some? (d/entity (:db-after tx-report-a) [:block/uuid target-uuid])))
      (is (some? (d/entity (:db-after tx-report-b) [:block/uuid target-uuid])))
      (is (tx-touches-uuid? normalized-a target-uuid)
          (str "shape A unexpectedly dropped recreated block from normalized tx: " (pr-str normalized-a)))
      (is (tx-touches-uuid? normalized-b target-uuid)
          (str "shape B unexpectedly dropped recreated block from normalized tx: " (pr-str normalized-b))))))

(deftest normalize-tx-data-replay-equivalence-for-retract-recreate-fuzz-test
  (testing "normalized tx-data should replay to same db-after for normal-block retract/recreate patterns"
    (let [conn (new-conn)
          page-uuid (create-page! conn "Page")]
      (d/transact! conn (mapv (fn [idx]
                                {:block/uuid (random-uuid)
                                 :block/title (str "seed-block-" idx)
                                 :block/page [:block/uuid page-uuid]
                                 :block/parent [:block/uuid page-uuid]
                                 :block/order (str "a" idx)})
                              (range 5)))
      (dotimes [seed 300]
        (let [rng (seeded-rng (+ 777 seed))
              db-before @conn
              blocks (normal-block-uuids db-before)
              target (pick-rand rng blocks)
              sibling (pick-rand rng (remove #(= % target) blocks))
              move-candidate (pick-rand rng (remove #(= % target) blocks))
              case-id (mod seed 6)
              base [[:db/retractEntity [:block/uuid target]]
                    [:db/add -1 :block/uuid target]
                    [:db/add -1 :block/title (str "fuzz-target-" seed)]
                    [:db/add -1 :block/page [:block/uuid page-uuid]]
                    [:db/add -1 :block/parent [:block/uuid page-uuid]]
                    [:db/add -1 :block/order (str "z" (mod seed 5))]]
              tx-data (case case-id
                        0
                        (cond-> base
                          sibling (conj [:db/add [:block/uuid sibling] :block/title (str "fuzz-sibling-title-" seed)]))

                        1
                        (cond-> base
                          sibling (conj [:db/retractEntity [:block/uuid sibling]]))

                        2
                        (if sibling
                          (into base
                                [[:db/retractEntity [:block/uuid sibling]]
                                 [:db/add -2 :block/uuid sibling]
                                 [:db/add -2 :block/title (str "fuzz-sibling-recreated-" seed)]
                                 [:db/add -2 :block/page [:block/uuid page-uuid]]
                                 [:db/add -2 :block/parent [:block/uuid page-uuid]]
                                 [:db/add -2 :block/order (str "y" (mod seed 5))]])
                          base)

                        3
                        (into base
                              [[:db/add -2 :block/uuid (random-uuid)]
                               [:db/add -2 :block/title (str "fuzz-fresh-" seed)]
                               [:db/add -2 :block/page [:block/uuid page-uuid]]
                               [:db/add -2 :block/parent [:block/uuid page-uuid]]
                               [:db/add -2 :block/order (str "x" (mod seed 7))]])

                        4
                        (if sibling
                          (into base
                                [[:db/retractEntity [:block/uuid sibling]]
                                 [:db/add -2 :block/uuid sibling]
                                 [:db/add -2 :block/title (str "fuzz-sibling-reparented-" seed)]
                                 [:db/add -2 :block/page [:block/uuid page-uuid]]
                                 [:db/add -2 :block/parent [:block/uuid target]]
                                 [:db/add -2 :block/order "a0"]])
                          base)

                        ;; 5
                        (cond-> base
                          move-candidate
                          (conj [:db/add [:block/uuid move-candidate] :block/parent [:block/uuid target]])))
              tx-report (d/with db-before tx-data {})
              normalized (db-normalize/normalize-tx-data (:db-after tx-report)
                                                         (:db-before tx-report)
                                                         (:tx-data tx-report))
              replay-report (d/with db-before normalized {})
              expected (block-state (:db-after tx-report))
              actual (block-state (:db-after replay-report))]
          (is (= expected actual)
              (str "seed=" seed
                  "\noriginal=" (pr-str tx-data)
                  "\nnormalized=" (pr-str normalized)
                  "\nexpected-count=" (count expected)
                  " actual-count=" (count actual))))))))
