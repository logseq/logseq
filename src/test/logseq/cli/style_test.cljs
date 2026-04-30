(ns logseq.cli.style-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.style :as style]))

(deftest test-strip-ansi
  (testing "strip-ansi removes ANSI sequences"
    (is (= "Hello"
           (style/strip-ansi "\u001b[1mHello\u001b[22m")))
    (is (= "Hello"
           (style/strip-ansi "\u001b[31mHello\u001b[39m")))))

(deftest test-style-disabled
  (testing "style helpers return plain text when color is disabled"
    (binding [style/*color-enabled?* false]
      (is (= "Hi" (style/bold "Hi")))
      (is (= "Hi" (style/dim "Hi")))
      (is (= "Hi" (style/green "Hi"))))))

(deftest test-style-enabled
  (testing "style helpers include ANSI when color is enabled"
    (binding [style/*color-enabled?* true]
      (is (not= "Hi" (style/bold "Hi")))
      (is (re-find #"\u001b\[[0-9;]*m" (style/bold "Hi"))))))
