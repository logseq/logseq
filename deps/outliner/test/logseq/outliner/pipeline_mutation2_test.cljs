(ns logseq.outliner.pipeline-mutation2-test
  "Tests for survivors of the second mutation run on logseq.outliner.pipeline."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(def ^:private timestamp (.getTime (js/Date. 2026 8 8 12)))

(defn- journal-conn
  []
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}
                         {:block/title "b2"}]}])]
    (d/transact! conn [{:block/uuid (random-uuid)
                        :block/title "Sep 8th, 2026" :block/journal-day 20260908
                        :block/tags [:logseq.class/Journal]}])
    conn))

(defn- journal-eid
  [db]
  (:e (first (d/datoms db :avet :block/journal-day 20260908))))

;; Fails if, in `build-journal-refs-for-datetime-properties`, `:logseq.property/scheduled` becomes `:logseq.property/type`.
(deftest datetime-journal-refs-of-built-in-properties-test
  (let [conn (journal-conn)
        db @conn
        journal (journal-eid db)
        refs-of (fn [property]
                  (#'outliner-pipeline/build-journal-refs-for-datetime-properties
                   db (d/entity db property) timestamp))]
    (is (some? journal))
    (is (= [journal] (refs-of :logseq.property/scheduled)))
    (is (= [journal] (refs-of :logseq.property/deadline)))))

;; Fails if, in `page-or-object?-helper`, `:logseq.property/created-from-property` becomes `:logseq.property/deadline`.
(deftest page-or-object-helper-excludes-property-value-objects-test
  (let [conn (journal-conn)
        page (db-test/find-page-by-title @conn "page1")]
    (is (true? (outliner-pipeline/page-or-object?-helper page)))
    (d/transact! conn [[:db/add (:db/id page) :logseq.property/created-from-property
                        (:db/id (d/entity @conn :logseq.property/query))]])
    (is (false? (boolean (outliner-pipeline/page-or-object?-helper (d/entity @conn (:db/id page))))))))

;; Fails if, in `non-ref-properties`, `:logseq.property/query` becomes `:logseq.property/scheduled`.
(deftest scheduled-datetime-property-builds-a-journal-ref-test
  (let [conn (journal-conn)
        block (db-test/find-block-by-content @conn "b1")
        _ (d/transact! conn [[:db/add (:db/id block) :logseq.property/scheduled timestamp]])
        db @conn
        updated (d/entity db (:db/id block))
        journal (journal-eid db)]
    (is (contains? (set (outliner-pipeline/db-rebuild-block-refs db updated)) journal))
    (is (contains? (set ((outliner-pipeline/db-rebuild-block-refs-fn db) updated)) journal))))

;; Fails if, in `block-refs`, the `distinct` step is dropped.
(deftest block-refs-are-distinct-test
  (let [conn (journal-conn)
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")
        ref (page-ref/->page-ref (:block/uuid b2))
        block' (assoc (d/pull @conn '[:db/id :block/uuid :block/title] (:db/id b1))
                      :block/title (str ref " and " ref)
                      :block/link {:db/id (:db/id b2)})]
    (is (= [(:db/id b2)] (vec (outliner-pipeline/db-rebuild-block-refs @conn block'))))))

;; Fails if, in `block-refs`, `:db/id` becomes `:db/ident`.
(deftest block-refs-drop-a-self-ref-given-as-a-lookup-test
  (let [conn (journal-conn)
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")
        block' {:db/id (:db/id b1)
                :block/uuid (:block/uuid b1)
                :block/tags [{:block/uuid (:block/uuid b1)}
                             {:block/uuid (:block/uuid b2)}]}]
    (testing "a ref to the block itself by uuid is removed, others stay"
      (is (= [[:block/uuid (:block/uuid b2)]]
             (vec (outliner-pipeline/db-rebuild-block-refs @conn block')))))))

;; Fails if, in `rebuild-block-refs-tx`, the body becomes `nil`, `:db/id` becomes `:db/ident`, the `[:db/retract (:db/id block) :block/refs]` tx entry is dropped, the `{:db/id (:db/id block)` tx entry is dropped, `:db/retract` becomes `:db/valueType`, `:block/refs` becomes `:block/tags`, the `:db/id` key is dropped or the `:block/refs` key is dropped.
(deftest rebuild-block-refs-tx-test
  (let [conn (journal-conn)
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")
        db @conn
        referencing (assoc (d/pull db '[:db/id :block/uuid :block/title] (:db/id b1))
                           :block/title (str "to " (page-ref/->page-ref (:block/uuid b2))))
        plain (d/pull db '[:db/id :block/uuid :block/title] (:db/id b2))]
    (is (= [[:db/retract (:db/id b1) :block/refs]
            {:db/id (:db/id b1) :block/refs [(:db/id b2)]}]
           (mapv (fn [item] (cond-> item (map? item) (update :block/refs vec)))
                 (#'outliner-pipeline/rebuild-block-refs-tx {:db-after db} [referencing plain]))))
    (testing "a block missing from db-after gets nothing"
      (is (empty? (#'outliner-pipeline/rebuild-block-refs-tx
                   {:db-after db} [(assoc referencing :db/id 987654321)]))))))
