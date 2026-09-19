(ns electron.assets-url-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.assets-url :as assets-url]))

(deftest assets-url->fs-path-test
  (testing "unix three-slash form"
    (is (= "/home/mschiff/logseq/graphs/Private/assets/foo.jpg"
           (assets-url/assets-url->fs-path
            "assets:///home/mschiff/logseq/graphs/Private/assets/foo.jpg"
            {:win32? false}))))

  (testing "chromium-rewritten unix host form"
    (is (= "/home/mschiff/logseq/graphs/Private/assets/foo.jpg"
           (assets-url/assets-url->fs-path
            "assets://home/mschiff/logseq/graphs/Private/assets/foo.jpg"
            {:win32? false}))))

  (testing "query and fragment are not part of the filename"
    (is (= "/home/user/my file.jpg"
           (assets-url/assets-url->fs-path
            "assets://home/user/my%20file.jpg?x=1#hash"
            {:win32? false}))))

  (testing "windows drive with protected colon"
    (is (= "/C:/Users/charlie/graph/assets/test.png"
           (assets-url/assets-url->fs-path
            "assets:///C/logseq__colon/Users/charlie/graph/assets/test.png"
            {:win32? true}))))

  (testing "chromium-rewritten windows drive host form"
    (is (= "/C:/Users/charlie/graph/assets/test.png"
           (assets-url/assets-url->fs-path
            "assets://C/logseq__colon/Users/charlie/graph/assets/test.png"
            {:win32? true}))))

  (testing "windows UNC"
    (is (= "//server/share/file.jpg"
           (assets-url/assets-url->fs-path
            "assets://server/share/file.jpg"
            {:win32? true})))))
