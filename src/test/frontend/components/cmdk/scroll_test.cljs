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

(deftest ensure-focus-visible-scroll-top-tracks-layout-shift
  (testing "recomputes a larger scroll top when lazy placeholders expand during animation"
    (let [placeholder-scroll-top (scroll/ensure-focus-visible-scroll-top
                                  {:scroll-top 100
                                   :viewport-height 200
                                   :scroll-height 2400
                                   :focus-top 560
                                   :focus-height 24})
          mounted-scroll-top (scroll/ensure-focus-visible-scroll-top
                              {:scroll-top placeholder-scroll-top
                               :viewport-height 200
                               :scroll-height 2400
                               :focus-top 620
                               :focus-height 32})]
      (is (= 384 placeholder-scroll-top))
      (is (= 452 mounted-scroll-top))
      (is (> mounted-scroll-top placeholder-scroll-top)))))

(deftest ensure-focus-visible-scroll-top-respects-scroll-padding
  (testing "scroll-padding-top creates top clearance"
    (is (= 88
           (scroll/ensure-focus-visible-scroll-top
            {:scroll-top 100
             :viewport-height 200
             :scroll-height 2000
             :focus-top 120
             :focus-height 20
             :scroll-padding-top 32
             :scroll-padding-bottom 32}))))
  (testing "scroll-padding-bottom creates bottom clearance"
    (is (= 102
           (scroll/ensure-focus-visible-scroll-top
            {:scroll-top 100
             :viewport-height 200
             :scroll-height 2000
             :focus-top 250
             :focus-height 20
             :scroll-padding-top 32
             :scroll-padding-bottom 32}))))
  (testing "item inside padded safe zone keeps current scroll-top"
    (is (= 100
           (scroll/ensure-focus-visible-scroll-top
            {:scroll-top 100
             :viewport-height 200
             :scroll-height 2000
             :focus-top 140
             :focus-height 20
             :scroll-padding-top 32
             :scroll-padding-bottom 32})))))

(deftest should-scroll-on-item-mounted?-test
  (testing "returns true only for keyboard pending-highlight mount match"
    (is (true? (scroll/should-scroll-on-item-mounted? :keyboard 8 8 8)))
    (is (false? (scroll/should-scroll-on-item-mounted? :mouse 8 8 8)))
    (is (false? (scroll/should-scroll-on-item-mounted? :keyboard nil 8 8)))
    (is (false? (scroll/should-scroll-on-item-mounted? :keyboard 8 7 8)))
    (is (false? (scroll/should-scroll-on-item-mounted? :keyboard 8 8 9)))
    (is (false? (scroll/should-scroll-on-item-mounted? :keyboard 8 8 nil)))))
