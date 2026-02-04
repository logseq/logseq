(ns frontend.worker.search-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.search :as search]))

(deftest ensure-highlighted-snippet-adds-marker
  (testing "adds highlight markers for first matching term"
    (is (= "今天学习$pfts_2lqh>$中文$<pfts_2lqh$"
           (search/ensure-highlighted-snippet nil "今天学习中文" "中文")))
    (is (= "Hello $pfts_2lqh>$World$<pfts_2lqh$"
           (search/ensure-highlighted-snippet nil "Hello World" "world")))))

(deftest ensure-highlighted-snippet-keeps-existing
  (testing "keeps snippet when already highlighted"
    (is (= "Hi $pfts_2lqh>$Logseq$<pfts_2lqh$"
           (search/ensure-highlighted-snippet "Hi $pfts_2lqh>$Logseq$<pfts_2lqh$" "Logseq" "logseq")))))

(deftest ensure-highlighted-snippet-no-match
  (testing "returns base text when no match"
    (is (= "Nothing here"
           (search/ensure-highlighted-snippet nil "Nothing here" "中文")))))