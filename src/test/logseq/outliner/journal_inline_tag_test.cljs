(ns logseq.outliner.journal-inline-tag-test
  "A block saved with an existing journal written as an inline tag, e.g.
  #[[Oct 25th, 2026]], must save. A journal can't become a tag, so the block
  refs the journal and isn't tagged with it."
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.state :as state]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(deftest save-block-with-existing-journal-as-inline-tag
  (let [journal-day 20261025
        journal-title (date-time-util/int->journal-title journal-day (state/get-date-formatter))
        conn (db-test/create-conn-with-blocks
              [{:page {:build/journal journal-day} :blocks []}
               {:page {:block/title "page1"}
                :blocks [{:block/title "host"}]}])
        journal (ldb/get-journal-page-by-day @conn journal-day)
        host (db-test/find-block-by-content @conn "host")
        ;; The renderer parses without a db: the journal is both a ref and a tag
        block (db-editor-handler/wrap-parse-block
               {:block/uuid (:block/uuid host)
                :block/title (str "#[[" journal-title "]]")})]
    (is (= #{journal-title} (set (map :block/title (:block/refs block))))
        "The journal is a ref of the parsed block")
    (is (= #{journal-title} (set (map :block/title (:block/tags block))))
        "The journal is a tag of the parsed block")
    (outliner-op/apply-ops! conn [[:save-block [block {}]]] {})
    (let [host (d/entity @conn (:db/id host))
          journal (d/entity @conn (:db/id journal))]
      (is (= (str "#[[" (:block/uuid journal) "]]") (:block/raw-title host)))
      (is (= [(:db/id journal)] (map :db/id (:block/refs host)))
          "The block refs the existing journal")
      (is (empty? (:block/tags host))
          "The block isn't tagged with the journal")
      (is (nil? (:db/ident journal)))
      (is (= [:logseq.class/Journal] (map :db/ident (:block/tags journal)))
          "The journal stays a journal"))))

(deftest save-block-with-a-journal-ref-inside-a-ref-keeps-the-journal-title
  ;; Key fuzzer: "[[ [[Nov 2nd, 2026]]]]" (a [[ popup pick inside an open [[) parses an outer page ref named
  ;; "[[nov 2nd, 2026]]". No page has that name, so the save asked create for it; create cleaned it to the
  ;; existing journal and returned the journal's uuid, and the ref's bracketed title was written over the
  ;; journal's ("journal page protected attr updated").
  (let [journal-day 20261025
        journal-title (date-time-util/int->journal-title journal-day (state/get-date-formatter))
        conn (db-test/create-conn-with-blocks
              [{:page {:build/journal journal-day} :blocks []}
               {:page {:block/title "page1"}
                :blocks [{:block/title "host"}]}])
        journal (ldb/get-journal-page-by-day @conn journal-day)
        host (db-test/find-block-by-content @conn "host")
        block (db-editor-handler/wrap-parse-block
               {:block/uuid (:block/uuid host)
                :block/title (str "[[ [[" journal-title "]]]]")})]
    (outliner-op/apply-ops! conn [[:save-block [block {}]]] {})
    (let [journal (d/entity @conn (:db/id journal))]
      (is (= journal-title (:block/title journal)) "the journal keeps its title")
      (is (= (string/lower-case journal-title) (:block/name journal)) "and its name"))))
