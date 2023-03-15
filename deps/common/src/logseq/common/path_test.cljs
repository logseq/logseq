(ns logseq.common.path-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.path :as path]))



(deftest test-safe-file-name?
  (testing "safe-file-name"
    (is (path/safe-filename? "foo"))
    (is (path/safe-filename? "foo bar"))
    (is (path/safe-filename? "foo-bar"))
    (is (path/safe-filename? "foo_bar"))
    (is (path/safe-filename? "foo.bar"))
    (is (path/safe-filename? "foo..bar"))
    (is (path/safe-filename? "foo...bar"))
    (is (= nil (path/safe-filename? "foo/bar")))
    (is (not (path/safe-filename? "foo?bar")))
    (is (not (path/safe-filename? "foo<bar")))
    (is (not (path/safe-filename? "foo>bar")))))


(deftest path-join
  (testing "join-path")
  (is (= "foo/bar" (path/path-join "foo" "bar")))
  (is (= "foo/bar" (path/path-join "foo/" "bar")))
  (is (= "/foo/bar/baz/asdf" (path/path-join "/foo/bar//baz/asdf/quux/..")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar" "baz")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar/" "baz")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar/" "/baz")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar" "/baz")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar" "/baz/")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar/" "/baz/")))
  (is (= "https://foo.bar/baz" (path/path-join "https://foo.bar/" "/baz"))))

