(ns frontend.format.mldoc-test
  (:require [frontend.format.mldoc :refer [parse-properties]]
            [clojure.string :as string]
            [cljs.test :refer [deftest are is testing]]))

(deftest test-parse-org-properties
  []
  (testing "just title"
    (let [content "#+TITLE:   some title   "
          props (parse-properties content "org")]
      (are [x y] (= x y)
        ;; TODO: should we trim in parse-properties?
        "some title" (string/trim (:title props)))))

  (testing "filetags"
    (let [content "
#+FILETAGS:   :tag1:tag_2:@tag:
#+ROAM_TAGS:  roamtag
body"
          props (parse-properties content "org")]
      (are [x y] (= x y)
        (list "@tag" "tag1" "tag_2") (sort (:filetags props))
        ["roamtag"] (:roam_tags props)
        (list "@tag" "roamtag" "tag1" "tag_2") (sort (:tags props)))))

  (testing "roam tags"
    (let [content "
#+FILETAGS: filetag
#+ROAM_TAGS: roam1 roam2
body
"
          props (parse-properties content "org")]
      (are [x y] (= x y)
        ["roam1" "roam2"] (:roam_tags props)
        (list "filetag" "roam1" "roam2") (sort (:tags props)))))

  (testing "quoted roam tags"
    (let [content "
#+ROAM_TAGS: \"why would\"  you use \"spaces\" xxx
body
"
          props (parse-properties content "org")]
      ;; TODO maybe need to sort or something
      (is (= ["why would" "spaces" "you" "use" "xxx"] (:roam_tags props))))))
