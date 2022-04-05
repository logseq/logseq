(ns frontend.format.mldoc-test
  (:require [frontend.format.mldoc :as mldoc]
            [cljs.test :refer [testing deftest are]]))

(deftest test-link
  (testing "non-link"
    (are [x y] (= (mldoc/link? :markdown x) y)
      "google.com" false))

  (testing "plain links"
    (are [x y] (= (mldoc/link? :markdown x) y)
      "http://www.google.com" true
      "http://google.com" true))

  (testing "org links with labels"
    (are [x y] (= (mldoc/link? :org x) y)
      "[[http://www.google.com][google]]" true
      "[[http://google.com][google]]" true
      "[[https://www.google.com][google]]" true
      "[[https://google.com][google]]" true))

  (testing "org links without labels"
    (are [x y] (= (mldoc/link? :org x) y)
      "[[http://www.google.com]]" true
      "[[https://www.google.com]]" true
      "[[draws/2022-03-06-15-00-28.excalidraw]]" true
      "[[assets/2022-03-06-15-00-28.pdf]]" true))

  (testing "markdown links"
    (are [x y] (= (mldoc/link? :markdown x) y)
      "[google](http://www.google.com)" true
      "[google](https://www.google.com)" true
      "[[draws/2022-03-06-15-00-28.excalidraw]]" true
      "![a pdf](assets/2022-03-06-15-00-28.pdf)" true))

  ;; https://github.com/logseq/logseq/issues/4308
  (testing "parsing links should be finished"
    (are [x y] (= (mldoc/link? :markdown x) y)
      "[YouTube](https://www.youtube.com/watch?v=-8ym7pyUs9gL) - [Vimeo](https://vimeo.com/677920303) {{youtube https://www.youtube.com/watch?v=-8ym7pyUs9g}}" true)))
