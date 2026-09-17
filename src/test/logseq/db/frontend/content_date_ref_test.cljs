(ns logseq.db.frontend.content-date-ref-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]))

(deftest id-ref->title-ref-keeps-journal-dates-visible-test
  (let [journal-uuid #uuid "11111111-1111-1111-1111-111111111111"
        content (str "meet on " (page-ref/->page-ref journal-uuid))
        journal {:block/uuid journal-uuid
                 :block/title ""
                 :block/name ""
                 :block/journal-day 20260405
                 :block/tags [{:db/ident :logseq.class/Journal}]}]
    (is (= (str "meet on " (page-ref/->page-ref "Apr 5th, 2026"))
           (db-content/id-ref->title-ref content [journal]))
        "Blank stored journal titles must still render a real date string")
    (is (not= (str "meet on " (page-ref/->page-ref ""))
              (db-content/id-ref->title-ref content [journal]))
        "Date refs must not collapse to [[]]")))
