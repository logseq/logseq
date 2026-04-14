;; src/test/memo/parser_test.cljs
(ns memo.parser-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.parser :as parser]))

(deftest test-parse-frontmatter
  (testing "parses YAML frontmatter correctly"
    (let [content "---\nid: test-001\ntype: character\nimportance: high\n---\n# Test"
          result (parser/parse-frontmatter content)]
      (is (= (:id result) "test-001"))
      (is (= (:type result) :character))
      (is (= (:importance result) :high)))))

(deftest test-extract-relations
  (testing "extracts [[link]] relations from content"
    (let [content "# Test\nSome text [[张三]] and [[李四 partner]]"
          relations (parser/extract-relations content)]
      (is (= (count relations) 2))
      (is (= (first relations) {:target "张三" :type :default}))
      (is (= (second relations) {:target "李四" :type :partner})))))