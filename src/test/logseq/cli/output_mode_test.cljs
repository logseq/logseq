(ns logseq.cli.output-mode-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.output-mode :as output-mode]))

(deftest test-allowed-output-modes
  (is (= #{:human :json :edn} output-mode/allowed-keywords))
  (is (= #{"human" "json" "edn"} output-mode/allowed-values)))

(deftest test-parse
  (testing "parses string and keyword output modes"
    (is (= :human (output-mode/parse "human")))
    (is (= :json (output-mode/parse " JSON ")))
    (is (= :edn (output-mode/parse :edn))))

  (testing "returns nil for unknown or blank values"
    (is (nil? (output-mode/parse "")))
    (is (nil? (output-mode/parse "  ")))
    (is (nil? (output-mode/parse "yaml")))
    (is (nil? (output-mode/parse :yaml)))
    (is (nil? (output-mode/parse nil)))))

(deftest test-structured-output
  (is (true? (output-mode/structured? :json)))
  (is (true? (output-mode/structured? "edn")))
  (is (false? (output-mode/structured? :human)))
  (is (false? (output-mode/structured? "yaml"))))

(deftest test-string-value
  (is (= "json" (output-mode/string-value :json)))
  (is (= "edn" (output-mode/string-value "EDN")))
  (is (nil? (output-mode/string-value :yaml))))
