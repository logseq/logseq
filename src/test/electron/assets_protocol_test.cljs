(ns electron.assets-protocol-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.assets-protocol :as assets-protocol]))

(deftest url->file-path-test
  (testing "a URL whose first path segment was read as the host resolves to an absolute path"
    (is (= "/home/mschiff/logseq/graphs/Private/assets/6aae88ad.jpg"
           (assets-protocol/url->file-path
            "assets://home/mschiff/logseq/graphs/Private/assets/6aae88ad.jpg" false))))
  (testing "a URL that keeps the leading slash is used as it is"
    (is (= "/home/mschiff/assets/a.jpg"
           (assets-protocol/url->file-path "assets:///home/mschiff/assets/a.jpg" false))))
  (testing "percent escapes are decoded and the query and fragment are dropped"
    (is (= "/home/me/my graph/assets/a b.html"
           (assets-protocol/url->file-path
            "assets://home/me/my%20graph/assets/a%20b.html?mode=dark#top" false))))
  (testing "on Windows a path without a leading slash is a UNC path"
    (is (= "//server/share/a.png"
           (assets-protocol/url->file-path "assets://server/share/a.png" true)))
    (is (= "/C:/Users/me/a.png"
           (assets-protocol/url->file-path "assets:///C:/Users/me/a.png" true)))))
