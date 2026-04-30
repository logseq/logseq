(ns logseq.cli.log-test
  (:require [cljs.test :refer [deftest is testing]]
            [lambdaisland.glogi :as log]
            [logseq.cli.log :as cli-log]))

(deftest test-truncate-preview
  (testing "truncates long strings with length metadata"
    (let [value (apply str (repeat 50 "a"))
          result (cli-log/truncate-preview value 10)]
      (is (= 50 (:length result)))
      (is (= 10 (count (:preview result))))
      (is (true? (:truncated? result)))))

  (testing "does not truncate short strings"
    (let [value "short"
          result (cli-log/truncate-preview value 10)]
      (is (= 5 (:length result)))
      (is (= "short" (:preview result)))
      (is (false? (:truncated? result)))))

  (testing "handles collections"
    (let [value [1 2 3]
          result (cli-log/truncate-preview value 100)]
      (is (= (count "[1 2 3]") (:length result)))
      (is (= "[1 2 3]" (:preview result)))
      (is (false? (:truncated? result)))))

  (testing "handles nil"
    (let [result (cli-log/truncate-preview nil 10)]
      (is (= 3 (:length result)))
      (is (= "nil" (:preview result)))
      (is (false? (:truncated? result))))))

(deftest test-debug-logging-gated-by-verbose
  (let [records (atom [])
        handler (fn [record]
                  (swap! records conj record))]
    (log/add-handler handler)
    (cli-log/set-verbose! false)
    (log/debug :event :cli/verbose-test)
    (is (empty? @records))

    (cli-log/set-verbose! true)
    (log/debug :event :cli/verbose-test)
    (is (= 1 (count @records)))

    (log/remove-handler handler)
    (cli-log/set-verbose! false)))
