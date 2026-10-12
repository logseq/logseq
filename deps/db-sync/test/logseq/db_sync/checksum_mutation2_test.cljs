(ns logseq.db-sync.checksum-mutation2-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as checksum]
            [logseq.db.frontend.schema :as db-schema]))

(def ^:private page-a-uuid #uuid "00000000-0000-0000-0000-00000000000a")
(def ^:private page-b-uuid #uuid "00000000-0000-0000-0000-00000000000b")
(def ^:private parent-uuid #uuid "00000000-0000-0000-0000-00000000000c")
(def ^:private child-uuid #uuid "00000000-0000-0000-0000-00000000000d")

(defn- fixed-db
  []
  (d/db-with (d/empty-db db-schema/schema)
             [{:db/id 1 :block/uuid page-a-uuid :block/name "page-a" :block/title "Page A"}
              {:db/id 2 :block/uuid page-b-uuid :block/name "page-b" :block/title "Page B"}
              {:db/id 3 :block/uuid parent-uuid :block/title "Parent" :block/order "a0"
               :block/parent 1 :block/page 1}
              {:db/id 4 :block/uuid child-uuid :block/title "Child" :block/order "a1"
               :block/parent 3 :block/page 1}]))

(deftest recompute-checksum-golden-test
  (is (= "de3d85af64cb053d" (checksum/recompute-checksum (fixed-db))))
  (is (= "cf4b5a20f9006de2"
         (checksum/recompute-checksum
          (d/db-with (fixed-db) [{:db/ident :logseq.kv/graph-rtc-e2ee? :kv/value true}])))))

(deftest recompute-checksum-diagnostics-lists-attrs-and-blocks-test
  (let [db (fixed-db)
        {:keys [attrs blocks e2ee?]} (checksum/recompute-checksum-diagnostics db)]
    (is (false? e2ee?))
    (is (= [:block/name :block/order :block/page :block/parent :block/title :block/uuid]
           attrs))
    (is (= [{:block/uuid page-a-uuid :block/parent nil :block/page nil :block/order nil
             :block/title "Page A" :block/name "page-a"}
            {:block/uuid page-b-uuid :block/parent nil :block/page nil :block/order nil
             :block/title "Page B" :block/name "page-b"}
            {:block/uuid parent-uuid :block/parent page-a-uuid :block/page page-a-uuid :block/order "a0"
             :block/title "Parent" :block/name nil}
            {:block/uuid child-uuid :block/parent parent-uuid :block/page page-a-uuid :block/order "a1"
             :block/title "Child" :block/name nil}]
           blocks))))

(deftest recompute-checksum-diagnostics-sorts-blocks-by-uuid-not-entity-id-test
  (let [late-uuid #uuid "00000000-0000-0000-0000-0000000000f0"
        early-uuid #uuid "00000000-0000-0000-0000-000000000001"
        db (d/db-with (d/empty-db db-schema/schema)
                      [{:db/id 1 :block/uuid late-uuid :block/name "late" :block/title "Late"}
                       {:db/id 2 :block/uuid early-uuid :block/name "early" :block/title "Early"}])]
    (is (= [early-uuid late-uuid]
           (mapv :block/uuid (:blocks (checksum/recompute-checksum-diagnostics db)))))))

(deftest recompute-checksum-diagnostics-e2ee-keeps-structure-attrs-test
  (let [db (d/db-with (fixed-db) [{:db/ident :logseq.kv/graph-rtc-e2ee? :kv/value true}])
        {:keys [attrs blocks e2ee?]} (checksum/recompute-checksum-diagnostics db)]
    (is (true? e2ee?))
    (is (= [:block/order :block/page :block/parent :block/uuid] attrs))
    (is (= [{:block/uuid page-a-uuid :block/parent nil :block/page nil :block/order nil}
            {:block/uuid page-b-uuid :block/parent nil :block/page nil :block/order nil}
            {:block/uuid parent-uuid :block/parent page-a-uuid :block/page page-a-uuid :block/order "a0"}
            {:block/uuid child-uuid :block/parent parent-uuid :block/page page-a-uuid :block/order "a1"}]
           blocks))))

(deftest update-checksum-finds-entities-by-uuid-in-tx-items-test
  (let [db0 (fixed-db)
        checksum0 (checksum/recompute-checksum db0)
        report (d/with db0 [[:db/retractEntity [:block/uuid child-uuid]]])
        full (checksum/recompute-checksum (:db-after report))]
    (is (not= checksum0 full))
    (doseq [entity [child-uuid (str child-uuid)]]
      (is (= full
             (checksum/update-checksum checksum0 (assoc report :tx-data [[:db/retractEntity entity]])))
          (pr-str entity)))))

(deftest checksum-counts-entities-tagged-with-each-page-class-test
  (let [classes [:logseq.class/Page :logseq.class/Journal :logseq.class/Tag :logseq.class/Property]
        base (d/db-with (fixed-db) (mapv (fn [class] {:db/ident class}) classes))
        base-checksum (checksum/recompute-checksum base)]
    (doseq [[idx class] (map-indexed vector classes)]
      (let [tagged-uuid (uuid (str "00000000-0000-0000-0000-0000000001" idx "0"))
            report (d/with base [{:db/id 50 :block/uuid tagged-uuid :block/title "tagged"}])
            db-untagged (:db-after report)
            checksum-untagged (checksum/recompute-checksum db-untagged)
            tag-report (d/with db-untagged [[:db/add 50 :block/tags class]])
            tagged-checksum (checksum/recompute-checksum (:db-after tag-report))]
        (is (= base-checksum checksum-untagged) (str class))
        (is (not= base-checksum tagged-checksum) (str class))
        (is (= tagged-checksum
               (checksum/update-checksum checksum-untagged tag-report))
            (str class))))))

(def ^:private shared-uuid #uuid "00000000-0000-0000-0000-0000000000ee")
(def ^:private other-uuid #uuid "00000000-0000-0000-0000-0000000000ff")

(def ^:private dup-base
  "Entities by eid as attr -> value maps: entities 3 and 5 share a :block/uuid,
  which a unique-identity db can only hold when built from datoms."
  {1 {:block/uuid page-a-uuid :block/name "page-a" :block/title "Page A"}
   3 {:block/uuid shared-uuid :block/title "T3" :block/parent 1 :block/page 1}
   4 {:block/uuid child-uuid :block/title "T4" :block/parent 3 :block/page 1}
   5 {:block/uuid shared-uuid :block/title "T5" :block/parent 1 :block/page 1}
   6 {:block/uuid other-uuid :block/title "T6" :block/parent 1 :block/page 1}})

(defn- entities->db
  [entities]
  (d/init-db (for [[e attrs] entities
                   [a v] attrs]
               (d/datom e a v))
             db-schema/schema))

(defn- entities->triples
  [entities]
  (set (for [[e attrs] entities
             [a v] attrs]
         [e a v])))

(defn- entities-change-report
  "A tx report from the datoms of entities-before to those of entities-after."
  [entities-before entities-after]
  (let [before (entities->triples entities-before)
        after (entities->triples entities-after)
        tx 536870913]
    {:db-before (entities->db entities-before)
     :db-after (entities->db entities-after)
     :tx-data (concat (for [[e a v] (sort-by pr-str (remove after before))]
                        (d/datom e a v tx false))
                      (for [[e a v] (sort-by pr-str (remove before after))]
                        (d/datom e a v tx true)))}))

(defn- update-matches-recompute?
  [entities-before entities-after]
  (let [report (entities-change-report entities-before entities-after)]
    (= (checksum/recompute-checksum (:db-after report))
       (checksum/update-checksum (checksum/recompute-checksum (:db-before report)) report))))

(deftest update-checksum-matches-recompute-with-duplicate-uuid-and-many-changes-test
  (is (< 1 (count (d/datoms (entities->db dup-base) :avet :block/uuid shared-uuid))))
  (doseq [[label changes]
          {:title-of-one-peer [[[3 :block/title] "T3 changed"]]
           :several-peers-and-others [[[3 :block/title] "T3 changed"]
                                      [[5 :block/order] "b0"]
                                      [[6 :block/title] "T6 changed"]]
           :child-moves-to-other-peer [[[4 :block/parent] 5]
                                       [[3 :block/title] "T3 changed"]]
           :every-title-and-order [[[3 :block/title] "T3 changed"]
                                   [[5 :block/title] "T5 changed"]
                                   [[4 :block/title] "T4 changed"]
                                   [[6 :block/title] "T6 changed"]
                                   [[6 :block/order] "c0"]
                                   [[3 :block/order] "a3"]
                                   [[5 :block/order] "a5"]]
           :page-renamed [[[1 :block/name] "page-a-renamed"]
                          [[3 :block/title] "T3 changed"]
                          [[5 :block/order] "d0"]]
           :peer-uuid-diverges [[[3 :block/uuid] parent-uuid]
                                [[3 :block/title] "T3 changed"]]}]
    (is (true? (update-matches-recompute?
                dup-base
                (reduce (fn [entities [path value]] (assoc-in entities path value)) dup-base changes)))
        (str label))))

(deftest update-checksum-matches-recompute-when-peer-leaves-duplicate-uuid-test
  (is (true? (update-matches-recompute? dup-base (dissoc dup-base 5))))
  (is (true? (update-matches-recompute? dup-base (-> dup-base
                                                     (dissoc 5)
                                                     (assoc-in [3 :block/title] "T3 changed"))))))

(deftest update-checksum-reflects-uuid-change-of-referenced-parent-test
  (let [no-dup (dissoc dup-base 5)]
    (is (true? (update-matches-recompute? no-dup (assoc-in no-dup [3 :block/uuid] parent-uuid))))
    (is (true? (update-matches-recompute? no-dup (assoc-in no-dup [1 :block/uuid] parent-uuid))))))

(deftest update-checksum-matches-recompute-when-duplicate-uuid-peers-share-a-changed-tuple-test
  (is (true? (update-matches-recompute? dup-base (-> dup-base
                                                     (assoc-in [3 :block/parent] 6)
                                                     (assoc-in [5 :block/parent] 6))))
      "Both peers write the same [uuid :block/parent value] tuple: it changes twice"))

(deftest update-checksum-matches-recompute-when-a-touched-block-is-also-a-dependent-test
  (let [u7 #uuid "00000000-0000-0000-0000-000000000007"
        u8 #uuid "00000000-0000-0000-0000-000000000008"
        base (assoc dup-base
                    7 {:block/uuid u7 :block/title "T7" :block/parent 3 :block/page 1}
                    8 {:block/uuid u8 :block/title "T8" :block/parent 3 :block/page 1})]
    (is (true? (update-matches-recompute? base (-> base
                                                   (assoc-in [3 :block/uuid] parent-uuid)
                                                   (assoc-in [4 :block/title] "T4 changed"))))
        "Child 4 is both changed and a referrer of 3, whose uuid changed")))

(deftest recompute-checksum-counts-a-repeated-tuple-of-an-entity-once-test
  (let [datoms [(d/datom 1 :block/uuid page-a-uuid) (d/datom 1 :block/name "page-a")
                (d/datom 3 :block/uuid shared-uuid) (d/datom 3 :block/name "p3")
                (d/datom 5 :block/uuid shared-uuid) (d/datom 5 :block/name "p5")
                (d/datom 4 :block/uuid child-uuid) (d/datom 4 :block/page 1) (d/datom 4 :block/parent 3)]
        one-parent (d/init-db datoms db-schema/schema)
        ;; a 2nd parent datom to the other holder of shared-uuid: the same
        ;; [child-uuid :block/parent shared-uuid] tuple again
        two-parents (d/init-db (conj datoms (d/datom 4 :block/parent 5)) db-schema/schema)]
    (is (= (checksum/recompute-checksum one-parent)
           (checksum/recompute-checksum two-parents)))))
