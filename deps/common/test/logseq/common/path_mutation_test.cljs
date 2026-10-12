(ns logseq.common.path-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.common.path :as path]))

;; Fails if, in `filename`, `seq` becomes `empty?` or `and` becomes `or`.
(deftest filename-decodes-only-file-urls-test
  (is (= "a b.png" (path/filename "file:///x/a%20b.png")))
  (is (= "a%20b.png" (path/filename "/x/a%20b.png")))
  (is (nil? (path/filename "file:///x/dir/"))))

;; Fails if, in `file-stem`, `first` becomes `last`.
(deftest file-stem-is-the-name-without-extension-test
  (is (= "b" (path/file-stem "/x/b.txt")))
  (is (= "archive.tar" (path/file-stem "/x/archive.tar.gz"))))

;; Fails if, in `uri-path-join-internal`, `last` becomes `first`.
(deftest url-join-parent-segment-drops-the-last-segment-test
  (is (= "file:///a/c" (path/url-join "file:///a/b" "../c")))
  (is (= "file:///a/c" (path/path-join "file:///a/b" "../c"))))

;; Fails if, in `url-join`, `or` becomes `and`.
(deftest url-join-keeps-the-host-of-a-unc-url-test
  (is (= "file://server/share/a" (path/url-join "file://server/share" "a")))
  (is (= "file://server/share/a" (path/path-join "file://server/share" "a"))))

;; Fails if, in `url-normalize`, `when` becomes `when-not`, `or` becomes `and` or `if` becomes `if-not`.
(deftest url-normalize-keeps-scheme-host-and-normalized-path-test
  (is (= "file://server/a/b" (path/url-normalize "file://server/a/./b")))
  (is (= "file://server/a/b" (path/path-normalize "file://server/a/./b")))
  (is (= "file://[bad" (path/url-normalize "file://[bad"))
      "an unparseable URL is returned as is"))

;; Fails if, in `trim-dir-prefix`, `if` becomes `if-not`.
(deftest trim-dir-prefix-does-not-decode-a-plain-path-test
  (is (= "b%20c.png" (path/trim-dir-prefix "/a" "/a/b%20c.png"))))
