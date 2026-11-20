(ns frontend.components.block.query-title-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]))

(deftest show-simple-query-builder-keeps-named-queries-test
  (testing "a simple query keeps the builder after it is named"
    (is (true? (#'block/show-simple-query-builder? true false false))
        "The builder decision does not depend on a blank Query title."))
  (testing "advanced queries and the gear panel hide the inline builder"
    (is (false? (#'block/show-simple-query-builder? true true false)))
    (is (false? (#'block/show-simple-query-builder? true false true)))
    (is (false? (#'block/show-simple-query-builder? false false false)))))
