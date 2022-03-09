(ns frontend.db.query-custom-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.react :as react]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(defn- custom-query
  [query]
  (react/clear-query-state!)
  (when-let [result (query-custom/custom-query test-helper/test-db query {})]
    (map first (deref result))))

(deftest custom-query-test
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "foo:: bar
- NOW b1
- TODO b2
- LATER b3
- b3"}])

  (is (= ["LATER b3"]
         (map :block/content
              (custom-query {:query '[:find (pull ?b [*])
                                      :where
                                      (block-content ?b "b")
                                      (task ?b #{"LATER"})]})))
      "datalog query returns correct results")

  (is (= ["LATER b3"]
         (map :block/content
              (custom-query {:query '[:find (pull ?b [*])
                                      :in $
                                      :where
                                      (block-content ?b "b")
                                      (task ?b #{"LATER"})]})))
      "datalog query with :in returns correct results")


  (is (= ["LATER b3"]
         (map :block/content
              (custom-query {:query (list 'and '(task later) "b")})))
      "Simple query returns correct results"))
