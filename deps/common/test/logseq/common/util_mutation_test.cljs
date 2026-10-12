(ns logseq.common.util-mutation-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.common.util :as common-util]))

;; Fails if, in `tag-valid?`, `when` becomes `when-not` or `not` becomes `identity`.
(deftest tag-valid?-test
  (is (true? (common-util/tag-valid? "foo bar")))
  (is (true? (common-util/tag-valid? "foo/bar")))
  (is (false? (common-util/tag-valid? "foo#bar")))
  (is (false? (common-util/tag-valid? "foo\nbar")))
  (is (nil? (common-util/tag-valid? nil)))
  (is (nil? (common-util/tag-valid? :foo))))

;; Fails if, in `wrapped-by`, `>=` becomes `>`, `last` becomes `first` or `first` becomes `last`.
(deftest wrapped-by-quotes?-test
  (testing "the shortest wrapped string is the 2 quote characters"
    (is (true? (common-util/wrapped-by-quotes? "\"\"")))
    (is (true? (common-util/wrapped-by-quotes? "\"foo\""))))
  (testing "a single quote character is not wrapped"
    (is (false? (common-util/wrapped-by-quotes? "\""))))
  (testing "both ends must be quotes"
    (is (false? (common-util/wrapped-by-quotes? "\"foo")))
    (is (false? (common-util/wrapped-by-quotes? "foo\"")))))

;; Fails if, in `safe-page-name-sanity-lc`, `if` becomes `if-not`.
(deftest safe-page-name-sanity-lc-test
  (is (= "foo bar" (common-util/safe-page-name-sanity-lc "Foo Bar")))
  (is (nil? (common-util/safe-page-name-sanity-lc nil)))
  (is (= 1 (common-util/safe-page-name-sanity-lc 1))))

;; Fails if, in `get-file-ext`, `and` becomes `or`.
(deftest get-file-ext-test
  (is (= "md" (common-util/get-file-ext "pages/Foo.MD")))
  (is (false? (common-util/get-file-ext "pages/foo")))
  (is (false? (common-util/get-file-ext nil))))

;; Fails if, in `safe-read-string`, `when` becomes `when-not`.
(deftest safe-read-string-log-error?-test
  (let [logged (atom [])
        console-error (.-error js/console)]
    (set! (.-error js/console) (fn [& args] (swap! logged conj args)))
    (try
      (testing "a parse failure is logged by default"
        (is (nil? (common-util/safe-read-string "{:a")))
        (is (= 1 (count @logged))))
      (testing ":log-error? false reads quietly"
        (reset! logged [])
        (is (nil? (common-util/safe-read-string {:log-error? false} "{:a")))
        (is (= [] @logged)))
      (testing "a successful read logs nothing either way"
        (reset! logged [])
        (is (= {:a 1} (common-util/safe-read-string "{:a 1}")))
        (is (= [] @logged)))
      (finally
        (set! (.-error js/console) console-error)))))

;; Fails if, in `get-page-title`, `or` becomes `and`.
(deftest get-page-title-test
  (is (= "Foo" (common-util/get-page-title {:block/title "Foo" :block/name "foo"})))
  (is (= "foo" (common-util/get-page-title {:block/name "foo"}))))
