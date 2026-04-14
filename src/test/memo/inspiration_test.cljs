;; src/test/memo/inspiration_test.cljs
(ns memo.inspiration-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.inspiration :as inspiration]))

(deftest test-expansion-prompt
  (testing "generates expansion prompt for character"
    (let [prompt (inspiration/build-expansion-prompt {:logseq.memo/id "李明" :logseq.memo/type :character})]
      (is (string/includes? prompt "李明"))
      (is (string/includes? prompt "故事情节")))))
