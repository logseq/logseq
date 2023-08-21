(ns frontend.searchmixer-test
  (:require [frontend.ai.search-mixer :as mixer]
            [clojure.test :refer [deftest is testing]]))

(deftest fuse-rank-search-results-test
  (let [mock-results [{:key "A" :fuse-score 0.1 :semantic-score 0.3}
                      {:key "B" :fuse-score 0.2 :semantic-score 0.5}
                      {:key "C" :fuse-score 0.3 :semantic-score 0.9}]
        results (mixer/sort-scores-search-results mock-results)]

    ;; Expect the closest match to the query "appl" to be "Apple"
    (is (= (:key (first results)) "C"))
    (is (= (:key (second results)) "B"))
    (is (= (:key (last results)) "A"))))

(deftest fuse-rank-scoring-test
  (let [mock-search-results [{:key "A" :content "cat cat"}
                             {:key "B" :content "doc dog at"}
                             {:key "C" :content "you are a really nice man"}]
        mock-query "cat"
        results (mixer/assoc-fuse-score mock-search-results mock-query)]

    ;; Validate the fuse-scores associated based on the query
    (is (> (:fuse-score (first results)) 0.007))
    (is (< (:fuse-score (first results)) 0.008))
    (is (> (:fuse-score (second results)) 0.53))
    (is (< (:fuse-score (second results)) 0.54))
    (is (= (:fuse-score (last results)) 1.0))   ; No match for "C" in our example output, so default to 1.0
    ))

(deftest empty-search-results-test
  (let [mock-search-results []
        mock-query "cat"
        results (mixer/assoc-fuse-score mock-search-results mock-query)]
    (is (empty? results))))

(deftest empty-query-test
  (let [mock-search-results [{:key "A" :content "apple"}]
        mock-query ""
        results (mixer/assoc-fuse-score mock-search-results mock-query)]
    (is (= (:fuse-score (first results)) 1.0))))

(deftest no-match-content-test
  (let [mock-search-results [{:key "A" :content "apple"}
                             {:key "B" :content "banana"}]
        mock-query "grape"
        results (mixer/assoc-fuse-score mock-search-results mock-query)]
    (is (= (:fuse-score (first results)) 0.6))
    (is (= (:fuse-score (second results)) 1.0))))

(deftest all-exact-match-test
  (let [mock-search-results [{:key "A" :content "apple"}
                             {:key "B" :content "banana"}]
        mock-query "apple"
        results (mixer/assoc-fuse-score mock-search-results mock-query)]
    (is (< (:fuse-score (first results)) 0.01))   ; The score should be very close to 0 since it's an exact match
    (is (= (:fuse-score (second results)) 1.0))) ; No match for "B" with query "apple"
)

(deftest test-assoc-semantic-score
  (testing "Ensures every result has :semantic-score key"
    (let [results [{:id 1} {:id 2}]
          updated-results (mixer/assoc-default-semantic-score results 0)]
      (is (every? (fn [result] (contains? result :semantic-score)) updated-results))))

  (testing "Doesn't overwrite existing :semantic-score"
    (let [results [{:id 1 :semantic-score 5} {:id 2}]
          updated-results (mixer/assoc-default-semantic-score results 0)]
      (is (= 5 (:semantic-score (first updated-results))))))

  (testing "Associates :semantic-score with worst-score value"
    (let [results [{:id 1} {:id 2}]
          worst-score -10
          updated-results (mixer/assoc-default-semantic-score results worst-score)]
      (is (every? (fn [result] (= worst-score (:semantic-score result))) updated-results)))))

(deftest test-transform-semantic-results
  (testing "Maps :uuid to :key and :score to :semantic-score"
    (let [results [{:uuid "f8e9a320-a010-4531-8b8c-60d5d7658ded" :score 0.8498561299043332 :name "test1"}
                   {:uuid "a1b2c3d4-e5f6-7890-g1h2-34567890ijkl" :score 0.4567891234567891 :name "test2"}]
          expected-results [{:key "f8e9a320-a010-4531-8b8c-60d5d7658ded" :semantic-score 0.8498561299043332 :name "test1"}
                            {:key "a1b2c3d4-e5f6-7890-g1h2-34567890ijkl" :semantic-score 0.4567891234567891 :name "test2"}]
          transformed-results (mixer/transform-semantic-results results)]
      (is (= expected-results transformed-results))))

  (testing "Preserves other records in the results"
    (let [results [{:uuid "12345678-90ab-cdef-1234-567890abcdef" :score 0.1234567890123456 :type "sample"}]
          transformed-result (first (mixer/transform-semantic-results results))]
      (is (contains? transformed-result :type))
      (is (= "sample" (:type transformed-result))))))

(deftest test-merge-duplicated-search-results
  (testing "Results with unique keys remain unchanged"
    (let [results [{:key "a" :fuse-score 0.1 :semantic-score 0.9}
                   {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          expected-results results
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results)))))

  (testing "Duplicate results with the same key are merged"
    (let [results [{:key "a" :fuse-score 0.1 :semantic-score 0.9}
                   {:key "a" :fuse-score 0.2 :semantic-score 0.9}
                   {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          expected-results [{:key "a" :fuse-score 0.1 :semantic-score 0.9}
                            {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results)))))

  (testing "Takes the maximum value if there are conflicting scores for the same key"
    (let [results [{:key "a" :fuse-score 0.1 :semantic-score 0.7}
                   {:key "a" :fuse-score 0.2 :semantic-score 0.9}
                   {:key "b" :fuse-score 0.2 :semantic-score 0.6}
                   {:key "b" :fuse-score 0.1 :semantic-score 0.8}]
          expected-results [{:key "a" :fuse-score 0.1 :semantic-score 0.7}
                            {:key "b" :fuse-score 0.1 :semantic-score 0.6}]
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results))))))

(deftest test-merge-duplicated-search-results-with-missing-keys
  (testing "Entries without a :key are preserved"
    (let [results [{:fuse-score 0.1 :semantic-score 0.9}
                   {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          expected-results results
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results)))))

  (testing "Handles missing :fuse-score and :semantic-score correctly"
    (let [results [{:key "a" :fuse-score 0.1}
                   {:key "a" :semantic-score 0.9}
                   {:key "b" :fuse-score 0.2}
                   {:key "b" :semantic-score 0.8}]
          expected-results [{:key "a" :fuse-score 0.1 :semantic-score 0.9}
                            {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results)))))

  (testing "Merges entries with and without scores correctly"
    (let [results [{:key "a" :fuse-score 0.1 :semantic-score 0.7}
                   {:key "a"}
                   {:key "b" :fuse-score 0.2}
                   {:key "b" :semantic-score 0.8}]
          expected-results [{:key "a" :fuse-score 0.1 :semantic-score 0.7}
                            {:key "b" :fuse-score 0.2 :semantic-score 0.8}]
          merged-results (mixer/merge-duplicated-search-results results)]
      (is (= (set expected-results) (set merged-results))))))

(deftest ^:focus test-merge-search-results
  (let [trad-results [{:block/uuid "uuid1" :block/content "Hello world"}
                      {:block/uuid "uuid2" :block/content "Goodbye world"}
                      {:block/uuid "uuid3" :block/content "Hello universe"}]
        semantic-results [{:key "uuid4"
                           :id 18
                           :data {:snippet "Greetings earthlings"
                                  :page 191514
                                  :id 191514
                                  :uuid "uuid4"}
                           :score 0.925}
                          {:key "uuid5"
                           :id 19
                           :data {:snippet "Hello galaxy"
                                  :page 191515
                                  :id 191515
                                  :uuid "uuid5"}
                           :score 0.750}]
        query "Hello"
        merged-results (mixer/merge-search-results trad-results semantic-results query)]

    (is (not (empty? merged-results)))
    (is (= 5 (count merged-results)))
    (prn merged-results)
    ))
