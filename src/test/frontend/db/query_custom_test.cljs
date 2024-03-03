(ns frontend.db.query-custom-test
  (:require [cljs.test :refer [deftest is use-fixtures testing]]
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

  (testing "advanced datalog queries"
    (is (= ["LATER b3"]
           (map :block/content
                (custom-query {:query '[:find (pull ?b [*])
                                        :where
                                        (block-content ?b "b")
                                        (task ?b #{"LATER"})]})))
        "basic advanced query works")

    (is (= ["LATER b3"]
           (map :block/content
                (custom-query {:query '[:find (pull ?b [*])
                                        :in $
                                        :where
                                        (block-content ?b "b")
                                        (task ?b #{"LATER"})]})))
        "advanced query with an :in works")

    (is (= ["foo:: bar\n" "b3"]
           (map :block/content
                (custom-query {:query '[:find (pull ?b [*])
                                        :in $ ?query %
                                        :where
                                        (block-content ?b ?query)
                                        (not-task ?b)]
                               :inputs ["b"
                                        '[[(not-task ?b)
                                           (not [?b :block/marker _])]]]})))
        "advanced query that uses rule from logseq and rule from :inputs")

    (is (= ["LATER b3"]
           (map :block/content
                (custom-query {:query '[:find (pull ?b [*])
                                        :in $ %
                                        :where
                                        (starts-with ?b "LA")
                                        (task ?b #{"LATER"})]
                               :rules '[[(starts-with ?b ?substr)
                                         [?b :block/content ?content]
                                         [(clojure.string/starts-with? ?content ?substr)]]]})))
        "advanced query that uses :rules and rules from logseq")

    (is (= #{"page1"}
           (set
            (map #(get-in % [:block/page :block/name])
                 (custom-query {:query '[:find (pull ?b [*])
                                         :in $ ?page
                                         :where
                                         (page ?b ?page)]
                                :inputs ["page1"]}))))
        "advanced query with bound :in argument works"))

  (is (= ["LATER b3"]
         (map :block/content
              (custom-query {:query (list 'and '(task later) "b")})))
      "Simple query returns correct results"))
