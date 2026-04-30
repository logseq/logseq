(ns frontend.handler.export-property-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.cli.common.file :as common-file]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.frontend.property :as db-property]))

(deftest block-properties-content-uses-property-title-and-journal-title-for-datetime
  (let [datetime-ms 1776441600000
        expected-journal-title (date-time-util/int->journal-title
                                (date-time-util/ms->journal-day datetime-ms)
                                date-time-util/default-journal-title-formatter)
        properties (array-map
                    :logseq.property/deadline datetime-ms
                    :user.property/P1-MoCeM8Tf "hello")]
    (with-redefs [db-property/properties (constantly properties)
                  db-property/sort-properties (fn [prop-entities] prop-entities)
                  d/entity (fn [_db lookup]
                             (case lookup
                               :logseq.property/deadline {:db/ident :logseq.property/deadline
                                                          :block/title "deadline"
                                                          :logseq.property/type :datetime}
                               :user.property/P1-MoCeM8Tf {:db/ident :user.property/P1-MoCeM8Tf
                                                           :block/title "P1"
                                                           :logseq.property/type :default}
                               nil))]
      (is (= (str "  deadline:: " expected-journal-title "\n"
                  "  P1:: hello")
             (@#'common-file/block-properties-content nil {} "  " {}))))))
