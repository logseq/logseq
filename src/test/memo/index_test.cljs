;; src/test/memo/index_test.cljs
(ns memo.index-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.index :as index]))

(deftest test-repo-namespace
  (testing "index key includes repo path for isolation"
    (is (= (index/index-key "git/github.com/user/repo")
           :logseq.memo/git/github.com/user/repo))))
