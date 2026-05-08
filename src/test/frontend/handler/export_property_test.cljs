(ns frontend.handler.export-property-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.cli.common.file :as common-file]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.frontend.property :as db-property]))

(deftest block-properties-content-uses-property-title-and-time-for-datetime
  (let [datetime-ms (tc/to-long (t/date-time 2026 5 14 9 30))
        expected-datetime (date-time-util/format
                           (t/to-default-time-zone (tc/from-long datetime-ms))
                           "MMM do, yyyy HH:mm")
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
      (is (= (str "  deadline:: " expected-datetime "\n"
                  "  P1:: hello")
             (@#'common-file/block-properties-content nil {} "  " {}))))))
