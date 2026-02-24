(ns frontend.components.query-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.query :as query]))

(deftest grouped-by-page-result-detection-supports-partial-page-refs
  (let [result [[{:db/id 42}
                 [{:block/uuid (random-uuid)}]]]]
    (is (true? (#'frontend.components.query/grouped-by-page-result? result true))
        "Grouped query results with page refs that only include :db/id should still be recognized")
    (is (false? (#'frontend.components.query/grouped-by-page-result? result false)))))
