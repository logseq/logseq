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

(deftest safe-file-name?
  (testing "safe-file-name"
    (is (path/safe-filename? "foo"))
    (is (path/safe-filename? "foo bar"))
    (is (path/safe-filename? "foo-bar"))
    (is (path/safe-filename? "foo_bar"))
    (is (path/safe-filename? "foo.bar"))
    (is (path/safe-filename? "foo..bar"))
    (is (path/safe-filename? "foo...bar"))
    (is (not (path/safe-filename? "foo/bar")))
    (is (not (path/safe-filename? "foo?bar")))
    (is (not (path/safe-filename? "foo<bar")))
    (is (not (path/safe-filename? "foo>bar")))))


(deftest path-join
  (testing "path-join"
    (is (= "foo/bar" (path/path-join "foo" "bar")))
    (is (= "foo/bar" (path/path-join "foo/" "bar")))
    (is (= "foo/bar" (path/path-join nil "foo" "bar"))
        "global dir")
    (is (= "/foo/bar/baz/asdf" (path/path-join "/foo/bar//baz/asdf/quux/..")))
    (is (= "assets:///foo.bar/baz" (path/path-join "assets:///foo.bar" "baz")))
    (is (= "assets:///foo.bar/baz" (path/path-join "assets:///foo.bar/" "baz")))))

(deftest path-absolute
  (testing "absolute"
    (is (true? (path/absolute? "D:\\sources\\sources.md")))
    (is (true? (path/absolute? "/home/xxx/logseq/test.md")))
    (is (false? (path/absolute? "logseq/test.md")))
    (is (false? (path/absolute? "test.md")))
    (is (false? (path/absolute? "test")))
    (is (false? (path/absolute? "D:test.md")))))
