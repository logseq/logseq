(ns frontend.handler.export-property-test
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.melange.bridge.common.api :as melange-common]
            [frontend.common.export.file :as common-file]
            [logseq.melange.bridge.db.property :as melange-property]))

(deftest block-properties-content-uses-property-title-and-time-for-datetime
  (let [datetime-ms (tc/to-long (t/date-time 2026 5 14 9 30))
        date-time (t/to-default-time-zone (tc/from-long datetime-ms))
        expected-datetime (melange-common/format-date-time
                           (t/year date-time)
                           (t/month date-time)
                           (t/day date-time)
                           (t/hour date-time)
                           (t/minute date-time)
                           (t/second date-time)
                           "MMM do, yyyy HH:mm")
        properties (array-map
                    :logseq.property/deadline datetime-ms
                    :user.property/P1-MoCeM8Tf "hello")]
    (with-redefs [melange-property/properties (constantly properties)
                  melange-property/sort-properties (fn [prop-entities] prop-entities)
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
