(ns electron.deeplink-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.deeplink :as deeplink]))

(deftest parse-url-test
  (testing "graph destinations are decoded and preserved"
    (doseq [host ["graph" "new-window"]]
      (is (= {:graph-identifier "North & South"
              :page-name "Overview" :block-id "node-id"}
             (select-keys
              (deeplink/parse-url (str "logseq://" host "/North%20%26%20South?page=Overview&block-id=node-id"))
              [:graph-identifier :page-name :block-id])))))
  (testing "invalid external input produces a link error"
    (doseq [url [nil "not a url" "https://example.com" "logseq://graph/Atlas%"
                "logseq://graph/%E0%A4%A"]]
      (is (= :deeplink/invalid-link-error (:i18n-key (deeplink/parse-url url))))))
  (testing "a missing graph has a specific error"
    (is (= :electron/link-open-failed-missing-graph
           (:i18n-key (deeplink/parse-url "logseq://graph/")))))
  (testing "other protocol actions remain available"
    (is (= "x-callback-url"
           (.-host (:parsed-url (deeplink/parse-url "logseq://x-callback-url/quickCapture")))))))

(deftest startup-deeplink-url-test
  (doseq [[pending argv mac? expected]
          [["logseq://graph/Atlas" ["Logseq" "logseq://graph/Other"] true "logseq://graph/Atlas"]
           [nil ["Logseq" "logseq://graph/Other"] true nil]
           [nil ["Logseq" "--flag" "logseq://graph/Atlas" "logseq://graph/Other"] false "logseq://graph/Atlas"]
           ["logseq://graph/Pending" ["Logseq" "logseq://graph/Argv"] false "logseq://graph/Pending"]
           [nil ["Logseq" "--flag" "/path/to/file"] false nil]]]
    (is (= expected (deeplink/startup-deeplink-url pending argv mac?)))))
