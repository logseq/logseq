(ns logseq.db.frontend.validate-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]))

;; Fails if, in `validate-local-db!`, `when` becomes `when-not`.
(deftest validate-local-db!-prints-counts-only-when-verbose-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])]
    (testing "quiet by default"
      (is (= "" (with-out-str (db-validate/validate-local-db! @conn {:db-name "g1"})))))
    (testing ":verbose prints the graph's counts"
      (is (string/starts-with? (with-out-str (db-validate/validate-local-db! @conn {:db-name "g1" :verbose true}))
                               "Read graph g1 with counts: ")))))
