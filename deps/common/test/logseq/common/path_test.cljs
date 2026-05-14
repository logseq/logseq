(ns logseq.common.path-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.path :as path]))

(deftest filename
  (is (= nil (path/filename "/path/to/dir/")))
  (is (= "file-name" (path/filename "/path/to/dir/file-name")))
  (is (= "file-name" (path/filename "dir/file-name"))))

(deftest split-ext
  (is (= ["some-song" "mp3"] (path/split-ext "some-song.MP3")))
  (is (= ["some-song" ""] (path/split-ext "some-song")))
  (is (= ["some-file.edn" "txt"] (path/split-ext "some-file.edn.txt"))))

(deftest path-join
  (testing "path-join"
    (is (= "foo/bar" (path/path-join "foo" "bar")))
    (is (= "foo/bar" (path/path-join "foo/" "bar")))
    (is (= "foo/bar" (path/path-join nil "foo" "bar"))
        "global dir")
    (is (= "/foo/bar/baz/asdf" (path/path-join "/foo/bar//baz/asdf/quux/..")))
    (is (= "assets:///foo.bar/baz" (path/path-join "assets:///foo.bar" "baz")))
    (is (= "assets:///foo.bar/baz" (path/path-join "assets:///foo.bar/" "baz")))
    (is (= "file:///D:/a.txt" (path/path-join "file://" "D:/a.txt")))
    (is (= "file:///c:/x" (path/path-join "file://" "c:/x")))
    (is (= "//NAS/MyGraph/logseq/config.edn" (path/path-join "//NAS/MyGraph" "logseq/config.edn")))))

(deftest prepend-protocol
  (testing "prepend-protocol"
    (is (= "file:///home/logseq/graph" (path/prepend-protocol "file:" "/home/logseq/graph")))
    (is (= "file:///C:/Graph/pages" (path/prepend-protocol "file:" "C:/Graph/pages")))
    (is (= "file://NAS/MyGraph" (path/prepend-protocol "file:" "//NAS/MyGraph"))
        "Windows UNC URL")))

(deftest file-url-or-path->path
  (testing "file URL paths"
    (is (= "D:/a.txt" (path/file-url-or-path->path "file:///D:/a.txt")))
    (is (= "c:/x" (path/file-url-or-path->path "file:///c:/x")))
    (is (= "//nas/share/x" (path/file-url-or-path->path "file://NAS/share/x")))
    (is (= "D:/a.txt" (path/file-url-or-path->path "file:///D%3A/a.txt")))
    (is (= "/home/admin/a.txt" (path/file-url-or-path->path "file:///home/admin/a.txt")))
    (is (= "/D:/a.txt" (path/file-url-or-path->path "/D:/a.txt")))
    (is (= "/D:\\a.txt" (path/file-url-or-path->path "/D:\\a.txt")))
    (is (= "/home/admin/a.txt" (path/file-url-or-path->path "/home/admin/a.txt")))))

(deftest path-absolute
  (testing "absolute"
    (is (true? (path/absolute? "D:\\sources\\sources.md")))
    (is (true? (path/absolute? "/home/xxx/logseq/test.md")))
    (is (false? (path/absolute? "logseq/test.md")))
    (is (false? (path/absolute? "test.md")))
    (is (false? (path/absolute? "test")))
    (is (false? (path/absolute? "D:test.md")))))

(deftest protocol-url
  (testing "protocol url"
    (is (true? (path/protocol-url? "mailto:help@logseq.com")))
    (is (true? (path/protocol-url? "https://logseq.com")))
    (is (true? (path/protocol-url? "ftp://logseq.com")))
    (is (true? (path/protocol-url? "file:///home/xxx/logseq/test.md")))
    (is (true? (path/protocol-url? "assets:///home/xxx/logseq/test.md")))
    (is (false? (path/protocol-url? "logseq/test.md")))
    (is (false? (path/protocol-url? "test.md")))
    (is (false? (path/protocol-url? "test")))
    (is (false? (path/protocol-url? "D:test.md")))))
