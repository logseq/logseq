(ns logseq.db-sync.checksum-mutation-test
  "Tests from the mutation triage of logseq.db-sync.checksum: each one fails
  on a mutant of checksum.cljs that the existing tests let survive."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as checksum]
            [logseq.db.frontend.schema :as db-schema]))

(defn- fixed-uuid
  [n]
  (uuid (str "00000000-0000-4000-8000-" (.padStart (str n) 12 "0"))))

(defn- incremental=recompute?
  "update-checksum from the full checksum of db-before, given tx-report with
  its :tx-data replaced by tx-data when given, equals the full checksum of
  db-after."
  ([tx-report]
   (incremental=recompute? tx-report (:tx-data tx-report)))
  ([tx-report tx-data]
   (= (checksum/recompute-checksum (:db-after tx-report))
      (checksum/update-checksum (checksum/recompute-checksum (:db-before tx-report))
                                (assoc tx-report :tx-data tx-data)))))

(defn- tagged-db
  "A page by name, a page by its Page tag only, and a block tagged with the
  named page (a tag that does not make it a page) with neither :block/page
  nor :block/name."
  []
  (-> (d/empty-db db-schema/schema)
      (d/db-with [{:db/id 100 :db/ident :logseq.class/Page}
                  {:db/id 1 :block/uuid (fixed-uuid 1) :block/name "page-a" :block/title "Page A"}
                  {:db/id 2 :block/uuid (fixed-uuid 2) :block/title "Tag-only page" :block/tags [100]}
                  {:db/id 3 :block/uuid (fixed-uuid 3) :block/title "Tagged block" :block/tags [1]}])))

;; Fails if, in `eligible-datoms?`, `=` becomes `not=`.
(deftest tag-only-page-edit-changes-incremental-checksum-test
  (testing "a page known only by its Page tag counts, and its edit reaches the incremental checksum"
    (let [db (tagged-db)
          report (d/with db [[:db/add 2 :block/title "Tag-only page renamed"]])]
      (is (not= (checksum/recompute-checksum db)
                (checksum/recompute-checksum (:db-after report))))
      (is (incremental=recompute? report)))))

;; Fails if, in `eligible-datoms?`, `and` becomes `or`.
(deftest non-page-tagged-block-edit-leaves-checksum-test
  (testing "a block tagged with a non-class page is not a page: its edit changes no checksum"
    (let [db (tagged-db)
          checksum-before (checksum/recompute-checksum db)
          report (d/with db [[:db/add 3 :block/title "Tagged block renamed"]])]
      (is (= checksum-before (checksum/recompute-checksum (:db-after report))))
      (is (= checksum-before (checksum/update-checksum checksum-before report))))))

(defn- page-db
  "Page 1 (by name) holding block 3, whose child is block 4."
  []
  (-> (d/empty-db db-schema/schema)
      (d/db-with [{:db/id 1 :block/uuid (fixed-uuid 1) :block/name "page-a" :block/title "Page A"}
                  {:db/id 2 :block/uuid (fixed-uuid 2) :block/name "page-b" :block/title "Page B"}
                  {:db/id 3 :block/uuid (fixed-uuid 3) :block/title "Parent" :block/parent 1 :block/page 1 :block/order "a0"}
                  {:db/id 4 :block/uuid (fixed-uuid 4) :block/title "Child" :block/parent 3 :block/page 1 :block/order "a0"}])))

;; Fails if, in `parse-uuid-string`, `when` becomes `when-not`.
(deftest uuid-string-entity-edit-matches-recompute-test
  (testing "normalized tx-data naming an existing block by its uuid string reaches the incremental checksum"
    (let [db (page-db)
          report (d/with db [[:db/add 4 :block/title "Child edited"]])]
      (is (incremental=recompute? report [[:db/add (str (fixed-uuid 4)) :block/title "Child edited"]])))))

;; Fails if, in `tx-item-eids`, `=` becomes `not=`.
(deftest new-block-with-non-uuid-tempid-matches-recompute-test
  (testing "a block created under a tempid that is not its uuid is found through its :block/uuid value"
    (let [db (page-db)
          tx-data [[:db/add "new-block" :block/uuid (fixed-uuid 5)]
                   [:db/add "new-block" :block/title "New"]
                   [:db/add "new-block" :block/parent [:block/uuid (fixed-uuid 1)]]
                   [:db/add "new-block" :block/page [:block/uuid (fixed-uuid 1)]]
                   [:db/add "new-block" :block/order "a1"]]
          report (d/with db tx-data)]
      (is (not= (checksum/recompute-checksum db)
                (checksum/recompute-checksum (:db-after report))))
      (is (incremental=recompute? report tx-data)))))

(defn- datoms-db
  "A db holding exactly datoms, which may break cardinality and uniqueness
  as stored datoms can (init-db does not check them)."
  [datoms]
  (d/init-db (map (fn [[e a v]] (d/datom e a v)) datoms) db-schema/schema))

(deftest edit-next-to-a-duplicated-block-uuid-matches-recompute-test
  (testing "2 blocks share a uuid; 1 loses it while the other is edited in the same tx"
    (let [db (datoms-db [[1 :block/uuid (fixed-uuid 1)] [1 :block/name "page-a"]
                         [5 :block/uuid (fixed-uuid 5)] [5 :block/page 1] [5 :block/title "Same"]
                         [6 :block/uuid (fixed-uuid 5)] [6 :block/page 1] [6 :block/title "Same"]])
          report (d/with db [[:db/retract 5 :block/uuid (fixed-uuid 5)]
                             [:db/add 6 :block/title "Edited"]])]
      (is (incremental=recompute? report)))))

;; Fails if, in `get-block-uuid`, `first` becomes `last`.
(deftest parent-with-2-uuid-datoms-normalizes-to-its-first-uuid-test
  (testing "a block moved under a parent holding 2 :block/uuid datoms names the parent by its first one, as the recompute does"
    (let [db (datoms-db [[1 :block/uuid (fixed-uuid 1)] [1 :block/name "page-a"]
                         [2 :block/uuid (fixed-uuid 2)] [2 :block/uuid (fixed-uuid 22)] [2 :block/name "page-b"]
                         [3 :block/uuid (fixed-uuid 3)] [3 :block/title "Block"] [3 :block/parent 1] [3 :block/page 1]])
          report (d/with db [[:db/add 3 :block/parent 2]])]
      (is (incremental=recompute? report)))))

;; Fails if, in `recompute-state`, `true` becomes `false`.
(deftest page-with-false-then-true-built-in-datoms-counts-test
  (testing "the first :logseq.property/built-in? datom (false) decides, in the recompute as in the incremental update"
    (let [db (datoms-db [[1 :block/uuid (fixed-uuid 1)] [1 :block/name "page-a"] [1 :block/title "Page A"]
                         [1 :logseq.property/built-in? false] [1 :logseq.property/built-in? true]])
          report (d/with db [[:db/add 1 :block/title "Page A renamed"]])]
      (is (incremental=recompute? report)))))

;; Fails if, in `net-tuple-delta`, `or` becomes `and`.
(deftest retracted-page-drops-its-blocks-from-incremental-checksum-test
  (testing "retracting a page by its normalized lookup ref also removes its blocks, which stop being eligible"
    (let [db (page-db)
          report (d/with db [[:db/retractEntity 1]])]
      (is (incremental=recompute? report [[:db/retractEntity [:block/uuid (fixed-uuid 1)]]])))))
