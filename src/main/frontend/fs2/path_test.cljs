(ns frontend.fs2.path-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.fs2.path :as path]))



(deftest test-safe-file-name?
  (testing "safe-file-name"
    (is (path/safe-file-name? "foo"))
    (is (path/safe-file-name? "foo bar"))
    (is (path/safe-file-name? "foo-bar"))
    (is (path/safe-file-name? "foo_bar"))
    (is (path/safe-file-name? "foo.bar"))
    (is (path/safe-file-name? "foo..bar"))
    (is (path/safe-file-name? "foo...bar"))
    (is (= nil (path/safe-file-name? "foo/bar")))
    (is (not (path/safe-file-name? "foo?bar")))
    (is (not (path/safe-file-name? "foo<bar")))
    (is (not (path/safe-file-name? "foo>bar")))))


(deftest path-join
  (testing "join-path")
  (is (= "foo/bar" (path/path-join ["foo" "bar"])))
  (is (= "foo/bar" (path/path-join ["foo/" "bar"])))
  (is (= "/foo/bar/baz/asdf" (path/path-join ["/foo/bar//baz/asdf/quux/.."]))))

((deftest url-join-test
   (testing "url-join"
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar" ["baz"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar/" ["baz"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar/" ["/baz"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar" ["/baz"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar" ["/baz/"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar/" ["/baz/"])))
     (is (= "https://foo.bar/baz" (path/url-join "https://foo.bar/" ["/baz"]))))))
