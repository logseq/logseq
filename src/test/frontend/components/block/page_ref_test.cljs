(ns frontend.components.block.page-ref-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]))

(deftest page-ref-fills-blank-journal-title-from-journal-day-test
  (let [page {:db/id 10
              :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
              :block/journal-day 20260405
              :block/title ""
              :block/name ""
              :block/tags [{:db/ident :logseq.class/Journal}]}
        filled (date-time-util/with-journal-display-title page "MMM do, yyyy")]
    (is (= "Apr 5th, 2026" (:block/title filled))
        "Referenced dates from the date picker must stay visible")
    (is (not (string/blank? (:block/title filled))))
    (is (not= (page-ref/->page-ref "")
              (page-ref/->page-ref (:block/title filled))))))
