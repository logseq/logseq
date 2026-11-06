(ns logseq.db.common.delete-blocks-mutation2-test
  "Second-run mutation survivors in logseq.db.common.delete-blocks."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.db.common.delete-blocks :as delete-blocks]
            [logseq.db.test.helper :as db-test]))

(defn- referencing-conn
  "A page with a target block and referencing blocks, each titled and stored
  with a raw-title that holds a block ref to the target."
  [referrer-titles]
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks (into [{:block/title "Target block"}]
                               (map (fn [title] {:block/title title}) referrer-titles))}]})
        target (db-test/find-block-by-content @conn "Target block")
        target-ref (block-ref/->block-ref (str (:block/uuid target)))]
    (d/transact! conn
                 (map (fn [title]
                        (let [referrer (db-test/find-block-by-content @conn title)]
                          {:db/id (:db/id referrer)
                           :block/raw-title (str title " " target-ref)
                           :block/refs #{(:db/id target)}}))
                      referrer-titles))
    conn))

;; Fails if, in `build-retracted-tx`, the body becomes `nil`, `:db/id` becomes `:db/retract`, `:block/raw-title` becomes `:block/refs`, the `[:db/retract (:db/id ref) :block/refs...` tx entry is dropped, `:db/retract` becomes `:db/retractEntity`, `:block/refs` becomes `:block/title`, `:db/add` becomes `:db/id` or `:block/title` becomes `:block/uuid`.
;; Fails if, in `block-entity?`, `:block/page` becomes `:block/raw-title`.
(deftest delete-block-retracts-refs-and-inlines-title-in-every-referrer
  (let [conn (referencing-conn ["see a" "see b"])
        target (db-test/find-block-by-content @conn "Target block")
        ref-a (db-test/find-block-by-content @conn "see a")
        ref-b (db-test/find-block-by-content @conn "see b")
        extra (set (delete-blocks/update-refs-history @conn [[:db/retractEntity (:db/id target)]] {}))]
    (is (contains? extra [:db/retract (:db/id ref-a) :block/refs (:db/id target)]))
    (is (contains? extra [:db/retract (:db/id ref-b) :block/refs (:db/id target)]))
    (is (contains? extra [:db/add (:db/id ref-a) :block/title "see a Target block"]))
    (is (contains? extra [:db/add (:db/id ref-b) :block/title "see b Target block"]))))

;; Fails if, in `build-retracted-tx`, `:db/id` becomes `:db/retract`.
(deftest delete-block-does-not-rewrite-title-of-referrer-deleted-with-it
  (let [conn (referencing-conn ["see a"])
        target (db-test/find-block-by-content @conn "Target block")
        ref-a (db-test/find-block-by-content @conn "see a")
        extra (set (delete-blocks/update-refs-history
                    @conn
                    [[:db/retractEntity (:db/id target)]
                     [:db/retractEntity (:db/id ref-a)]]
                    {}))]
    (is (not-any? #(and (= :db/add (first %)) (= (:db/id ref-a) (second %))) extra)
        "A referrer retracted in the same tx keeps its title")))
