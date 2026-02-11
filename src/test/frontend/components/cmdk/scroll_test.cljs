(ns frontend.components.cmdk.scroll-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.cmdk.scroll :as scroll]))

(deftest focus-row-visible-rect-normalization
  (testing "returns normalized geometry from container and target DOM data"
    (let [container #js {:scrollTop 100
                         :clientHeight 240
                         :scrollHeight 1200
                         :getBoundingClientRect (fn [] #js {:top 40 :height 240})}
          target #js {:getBoundingClientRect (fn [] #js {:top 90 :height 30})}]
      (is (= {:scroll-top 100
              :viewport-height 240
              :scroll-height 1200
              :focus-top 150
              :focus-height 30}
             (scroll/focus-row-visible-rect container target)))))
  (testing "returns nil when container or target is missing"
    (is (nil? (scroll/focus-row-visible-rect nil #js {})))
    (is (nil? (scroll/focus-row-visible-rect #js {} nil)))))

(deftest keyboard-navigation-still-moves-focus-and-keeps-visible
  (testing "keyboard-driven focus visibility correction keeps focused row in viewport"
    (is (= 170
           (scroll/ensure-focus-visible-scroll-top
            {:scroll-top 0
             :viewport-height 200
             :scroll-height 2000
             :focus-top 350
             :focus-height 20})))
    (is (= 120
           (scroll/ensure-focus-visible-scroll-top
            {:scroll-top 120
             :viewport-height 200
             :scroll-height 2000
             :focus-top 180
             :focus-height 20})))))

(deftest wheel-scroll-cannot-pass-focused-row-downward
  (testing "downward wheel scrolling is clamped when it would move past the focused row"
    (is (= 59
           (scroll/anchored-scroll-top
            {:scroll-top 0
             :delta-y 300
             :viewport-height 200
             :scroll-height 2000
             :focus-top 40
             :focus-height 20})))))

(deftest wheel-scroll-cannot-pass-focused-row-upward
  (testing "upward wheel scrolling is clamped when it would move past the focused row"
    (is (= 351
           (scroll/anchored-scroll-top
            {:scroll-top 400
             :delta-y -300
             :viewport-height 200
             :scroll-height 2000
             :focus-top 550
             :focus-height 20})))))

(deftest no-focus-falls-back-to-normal-wheel
  (testing "without focused row anchoring falls back to regular scrolling bounds"
    (is (= 340
           (scroll/anchored-scroll-top
            {:scroll-top 100
             :delta-y 240
             :viewport-height 200
             :scroll-height 2000})))
    (is (= 0
           (scroll/anchored-scroll-top
            {:scroll-top 10
             :delta-y -200
             :viewport-height 200
             :scroll-height 2000})))))

(deftest anchored-scroll-top-boundary-branches
  (testing "viewport-height <= 0 uses regular clamped scroll result"
    (is (= 100
           (scroll/anchored-scroll-top
            {:scroll-top 10
             :delta-y 500
             :viewport-height 0
             :scroll-height 100
             :focus-top 10
             :focus-height 10}))))
  (testing "min-top > max-top falls back to desired clamped scroll result"
    (is (= 5
           (scroll/anchored-scroll-top
            {:scroll-top 0
             :delta-y 5
             :viewport-height 200
             :scroll-height 220
             :focus-top 500
             :focus-height 20}))))
  (testing "without focus geometry positive overscroll is clamped to max"
    (is (= 100
           (scroll/anchored-scroll-top
            {:scroll-top 50
             :delta-y 1000
             :viewport-height 200
             :scroll-height 300})))))
