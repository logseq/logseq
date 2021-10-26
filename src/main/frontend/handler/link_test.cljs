(ns frontend.handler.link-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.handler.link :as link]))

(deftest test-link?
  (testing "plain links"
    (are [x y] (= (link/link? x) y)
      "http://www.google.com"
      {:type "plain-link" :url "http://www.google.com"}))

  (testing "org links"
    (are [x y] (= (link/link? x) y)
      "[[http://www.google.com][google]]"
      {:type "org-link" :url "http://www.google.com" :label "google"}))

  (testing "org links"
    (are [x y] (= (link/link? x) y)
      "[[http://www.google.com]]"
      {:type "org-link" :url "http://www.google.com" :label nil}))

  (testing "markdown links"
    (are [x y] (= (link/link? x) y)
      "http://www.google.com"
      {:type "plain-link" :url "http://www.google.com"})))
