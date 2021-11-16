(ns frontend.handler.test-link
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.handler.link :as link]))

(deftest test-link?
  (testing "non-link"
    (are [x y] (= (link/link? x) y)
      "google.com" nil
      "[[google.com][google]]" nil
      "[[google.com]]" nil
      "[google](google.com)" nil))
  
  (testing "plain links"
    (are [x y] (= (link/link? x) y)
      "http://www.google.com"
      {:type "plain-link" :url "http://www.google.com"}

      "http://google.com"
      {:type "plain-link" :url "http://google.com"}))

  (testing "org links"
    (are [x y] (= (link/link? x) y)
      "[[http://www.google.com][google]]"
      {:type "org-link" :url "http://www.google.com" :label "google"}

      "[[http://google.com][google]]"
      {:type "org-link" :url "http://google.com" :label "google"}

      "[[https://www.google.com][google]]"
      {:type "org-link" :url "https://www.google.com" :label "google"}

      "[[https://google.com][google]]"
      {:type "org-link" :url "https://google.com" :label "google"}))

  (testing "org links"
    (are [x y] (= (link/link? x) y)
      "[[http://www.google.com]]"
      {:type "org-link" :url "http://www.google.com" :label nil}

      "[[https://www.google.com]]"
      {:type "org-link" :url "https://www.google.com" :label nil}))

  (testing "markdown links"
    (are [x y] (= (link/link? x) y)
      "[google](http://www.google.com)"
      {:type "markdown-link" :url "http://www.google.com" :label "google"}

      "[google](https://www.google.com)"
      {:type "markdown-link" :url "https://www.google.com" :label "google"})))

#_(cljs.test/test-ns 'frontend.test-link)
