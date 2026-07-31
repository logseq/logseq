(ns frontend.components.avatar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.avatar :as avatar]))

(deftest initials-uses-two-letters-for-latin-names-without-spaces
  (is (= "AL" (avatar/initials "alice"))))

(deftest initials-uses-one-grapheme-for-non-latin-names-without-spaces
  (testing "CJK names fit avatar fallback"
    (is (= "会" (avatar/initials "会爬树的猫"))))
  (testing "other non-Latin names do not use arbitrary first two characters"
    (is (= "А" (avatar/initials "Алексей")))))

