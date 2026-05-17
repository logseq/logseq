(ns logseq.db.date-range-validate-test
  "Tests for the :daterange property type: type-set membership, DB validation,
   and correct storage of daterange value entities."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]))

;; ---- Type-set membership ----

(deftest daterange-is-in-correct-type-sets
  (testing ":daterange appears in all relevant property-type sets"
    (is (some #{:daterange} db-property-type/user-built-in-property-types)
        ":daterange is a user-visible property type")
    (is (contains? db-property-type/cardinality-property-types :daterange)
        ":daterange supports cardinality switching")
    (is (contains? db-property-type/user-ref-property-types :daterange)
        ":daterange values are stored as ref entities")))

;; ---- DB-level validation ----

(deftest date-range-property-validates
  (let [conn (db-test/create-conn)
        _ (d/transact! conn
                       [(sqlite-util/build-new-property
                         :logseq.property.user/my-date-range
                         {:logseq.property/type :daterange}
                         {:title "my-date-range"})])
        validation (db-validate/validate-local-db! @conn)]
    (when (seq (:errors validation))
      (println "ERRORS:")
      (doseq [e (:errors validation)]
        (println " dispatch-key:" (:dispatch-key e))
        (println " entity keys:" (keys (:entity e)))
        (println " errors:" (:errors e))))
    (is (empty? (:errors validation))
        "Graph with :daterange property has no validation errors")))

(deftest daterange-value-entities-validate
  (testing "Daterange entities with day/month/year precision and range (start+end) all pass DB validation"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Book {:block/title "Book"}}
                 :pages-and-blocks
                 [{:page {:block/title "Book A" :build/tags [:Book]}}
                  {:page {:block/title "Book B" :build/tags [:Book]}}
                  {:page {:block/title "Book C" :build/tags [:Book]}}
                  {:page {:block/title "Book D" :build/tags [:Book]}}]})
          _ (d/transact! conn
                         [(sqlite-util/build-new-property
                           :user.property/pub-date
                           {:logseq.property/type :daterange}
                           {:title "Publication Date"})])
          ;; One entity per precision type, plus a range value with both start and end
          tx (d/transact! conn
                          [{:db/id -1
                            :logseq.property.date/precision :day
                            :logseq.property.date/start    20250315}
                           {:db/id -2
                            :logseq.property.date/precision :month
                            :logseq.property.date/start    20250300}
                           {:db/id -3
                            :logseq.property.date/precision :year
                            :logseq.property.date/start    20250000}
                           {:db/id -4
                            :logseq.property.date/precision :day
                            :logseq.property.date/start    20250101
                            :logseq.property.date/end      20250315}])
          book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
          _ (d/transact! conn
                         [{:db/id (book-id "Book A") :user.property/pub-date (get-in tx [:tempids -1])}
                          {:db/id (book-id "Book B") :user.property/pub-date (get-in tx [:tempids -2])}
                          {:db/id (book-id "Book C") :user.property/pub-date (get-in tx [:tempids -3])}
                          {:db/id (book-id "Book D") :user.property/pub-date (get-in tx [:tempids -4])}])
          validation (db-validate/validate-local-db! @conn)]
      (when (seq (:errors validation))
        (println "ERRORS:")
        (doseq [e (:errors validation)]
          (println " " e)))
      (is (empty? (:errors validation))
          "Day, month, year, and range daterange values all pass DB validation"))))
