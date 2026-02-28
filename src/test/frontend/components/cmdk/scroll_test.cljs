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

(deftest ensure-focus-visible-scroll-top-returns-integers
  (testing "result is always an integer even with fractional inputs"
    (is (integer?
         (scroll/ensure-focus-visible-scroll-top
          {:scroll-top 10.5
           :viewport-height 200.7
           :scroll-height 2000.3
           :focus-top 350.2
           :focus-height 20.9})))))

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

(deftest scroll-behavior-strategy
  (testing "small distance uses smooth scrolling"
    (is (= :smooth
           (scroll/scroll-behavior 100 130 200))))
  (testing "distance exceeding 2x viewport uses instant scrolling"
    (is (= :instant
           (scroll/scroll-behavior 0 500 200))))
  (testing "distance exactly at threshold uses smooth scrolling"
    (is (= :smooth
           (scroll/scroll-behavior 0 400 200))))
  (testing "negative direction large distance uses instant scrolling"
    (is (= :instant
           (scroll/scroll-behavior 600 50 200))))
  (testing "same position returns smooth"
    (is (= :smooth
           (scroll/scroll-behavior 100 100 200)))))

(deftest accel-step-basic
  (testing "returns 1 during grace period"
    (is (= 1 (scroll/accel-step 0 200 150 5)))
    (is (= 1 (scroll/accel-step 100 200 150 5)))
    (is (= 1 (scroll/accel-step 199 200 150 5))))
  (testing "returns 2 at exactly delay-ms"
    ;; held=200, delay=200 → excess=0, quot(0,150)=0, inc→1 ... wait
    ;; Actually at exactly delay-ms: excess=0, quot(0,150)=0, 1+0=1
    ;; So step is still 1 at exactly delay boundary
    ;; Step becomes 2 at delay + 1 interval
    (is (= 1 (scroll/accel-step 200 200 150 5)))
    (is (= 2 (scroll/accel-step 350 200 150 5))))
  (testing "ramps up with held duration"
    ;; delay=200, interval=150
    ;; 500ms: excess=300, quot(300,150)=2, inc→3
    (is (= 3 (scroll/accel-step 500 200 150 5)))
    ;; 800ms: excess=600, quot(600,150)=4, inc→5
    (is (= 5 (scroll/accel-step 800 200 150 5))))
  (testing "caps at max-step"
    (is (= 5 (scroll/accel-step 2000 200 150 5)))
    (is (= 3 (scroll/accel-step 2000 200 150 3))))
  (testing "returns 1 for zero held time"
    (is (= 1 (scroll/accel-step 0 0 100 5))))
  (testing "always returns positive integer"
    (doseq [ms [0 50 100 200 300 500 1000 5000]]
      (let [s (scroll/accel-step ms 200 150 5)]
        (is (pos-int? s) (str "ms=" ms " step=" s))))))

(deftest adaptive-lerp-factor-basic
  (testing "returns base-factor when distance is 0"
    (is (= 0.3 (scroll/adaptive-lerp-factor 0.3 0.8 0 120))))
  (testing "returns max-factor when distance >= ramp-px"
    (is (= 0.8 (scroll/adaptive-lerp-factor 0.3 0.8 120 120)))
    (is (= 0.8 (scroll/adaptive-lerp-factor 0.3 0.8 500 120))))
  (testing "returns midpoint at half ramp distance"
    ;; distance=60, ramp=120 → t=0.5 → 0.3 + 0.5 * 0.5 = 0.55
    (is (< (js/Math.abs (- 0.55 (scroll/adaptive-lerp-factor 0.3 0.8 60 120)))
           0.001)))
  (testing "result is always between base and max"
    (doseq [d [0 10 30 60 90 120 200 1000]]
      (let [f (scroll/adaptive-lerp-factor 0.3 0.8 d 120)]
        (is (<= 0.3 f 0.8) (str "distance=" d " factor=" f)))))
  (testing "negative distance treated as absolute"
    (is (= (scroll/adaptive-lerp-factor 0.3 0.8 60 120)
           (scroll/adaptive-lerp-factor 0.3 0.8 -60 120)))))

(deftest lerp-scroll-top-basic
  (testing "moves towards target by factor of remaining distance"
    ;; current=0, target=100, factor=0.25 → 0 + 100*0.25 = 25
    (is (= 25 (scroll/lerp-scroll-top 0 100 0.25))))
  (testing "overshoots minimum step when factor*distance < 1"
    ;; current=99, target=100, diff=1, factor=0.25 → step=0.25 → clamped to min 1 → 100
    (is (= 100 (scroll/lerp-scroll-top 99 100 0.25))))
  (testing "snaps to target when within 0.5px"
    (is (= 100 (scroll/lerp-scroll-top 99.7 100 0.1))))
  (testing "moves upward towards smaller target"
    ;; current=100, target=0, factor=0.25 → 100 + (-100)*0.25 = 75
    (is (= 75 (scroll/lerp-scroll-top 100 0 0.25))))
  (testing "upward min step ensures progress"
    ;; current=1, target=0, diff=-1, factor=0.1 → step=-0.1 → clamped to -1 → 0
    (is (= 0 (scroll/lerp-scroll-top 1 0 0.1))))
  (testing "returns integer"
    (is (integer? (scroll/lerp-scroll-top 0 97 0.3)))))
