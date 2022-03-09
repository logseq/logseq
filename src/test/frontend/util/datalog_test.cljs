(ns frontend.util.datalog-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.util.datalog :as datalog-util]))

(deftest add-to-end-of-query-in
  (is (= '[:find ?b
           :in $ ?query %
           :where
           (block-content ?b ?query)]
         (datalog-util/add-to-end-of-query-section
          '[:find ?b
            :in $ ?query
            :where
            (block-content ?b ?query)]
          :in
          ['%]))
      "Add to :in in middle of query")

  (is (= '[:find ?b
           :where
           (block-content ?b ?query)
           :in $ ?query %]
         (datalog-util/add-to-end-of-query-section
          '[:find ?b
            :where
            (block-content ?b ?query)
            :in $ ?query]
          :in
          ['%]))
      "Add to :in at end of query"))
