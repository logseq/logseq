(ns frontend.util.email-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.email :as email]))

(deftest mask-email-preserves-email-shape
  (is (= "j***@***.**m" (email/mask-email "john@abc.com")))
  (is (= "a****@*******.**g" (email/mask-email "alice@example.org"))))

(deftest mask-email-keeps-only-edge-characters-visible
  (is (= "a@b" (email/mask-email "a@b")))
  (is (= "a@*.c" (email/mask-email "a@b.c")))
  (is (= "a**d" (email/mask-email "abcd"))))

(deftest mask-email-handles-blank-values
  (testing "nil and blank values are left empty"
    (is (nil? (email/mask-email nil)))
    (is (= "" (email/mask-email "")))
    (is (= " " (email/mask-email " ")))))
