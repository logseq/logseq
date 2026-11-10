(ns electron.deeplink-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.deeplink :as deeplink]))

(deftest find-deeplink-url-test
  (testing "picks the first logseq:// argument"
    (is (= "logseq://graph/timeline-demo"
           (deeplink/find-deeplink-url
            ["--flag" "logseq://graph/timeline-demo" "logseq://graph/other"]))))
  (testing "returns nil when absent"
    (is (nil? (deeplink/find-deeplink-url ["--flag" "/path/to/file"])))))

(deftest graph-identifier-from-url-test
  (testing "reads logseq://graph/<identifier>"
    (is (= "timeline-demo"
           (deeplink/graph-identifier-from-url "logseq://graph/timeline-demo")))
    (is (= "timeline-demo"
           (deeplink/graph-identifier-from-url "logseq://graph/timeline-demo?page=Home"))))
  (testing "ignores non-graph hosts and invalid URLs"
    (is (nil? (deeplink/graph-identifier-from-url "logseq://new-window/timeline-demo")))
    (is (nil? (deeplink/graph-identifier-from-url "logseq://x-callback-url/quickCapture")))
    (is (nil? (deeplink/graph-identifier-from-url "https://example.com")))
    (is (nil? (deeplink/graph-identifier-from-url "not a url")))
    (is (nil? (deeplink/graph-identifier-from-url nil)))))

(deftest startup-deeplink-url-test
  (testing "macOS cold start uses the pending open-url and ignores argv"
    (is (= "logseq://graph/timeline-demo"
           (deeplink/startup-deeplink-url
            "logseq://graph/timeline-demo"
            ["Logseq" "logseq://graph/other"]
            true)))
    (is (nil? (deeplink/startup-deeplink-url
               nil
               ["Logseq" "logseq://graph/other"]
               true))))
  (testing "Windows/Linux cold start reads argv when nothing is pending"
    (is (= "logseq://graph/timeline-demo"
           (deeplink/startup-deeplink-url
            nil
            ["Logseq" "logseq://graph/timeline-demo"]
            false)))
    (is (= "logseq://graph/pending"
           (deeplink/startup-deeplink-url
            "logseq://graph/pending"
            ["Logseq" "logseq://graph/argv"]
            false)))))

(deftest pre-fix-open-url-without-window-was-dropped
  "Documents the db-test #1520 failure mode: when no main window exists yet,
   the previous open-url handler ignored the URL entirely. Cold start must
   stash the URL (covered by startup-deeplink-url-test) instead."
  (testing "without a pending URL, macOS has no deeplink source on argv"
    (is (nil? (deeplink/startup-deeplink-url
               nil
               ["Logseq"]
               true))
        "macOS cold start previously lost open-url and had nothing left to open")))
