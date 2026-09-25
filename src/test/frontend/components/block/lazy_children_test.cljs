(ns frontend.components.block.lazy-children-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [frontend.util :as util]))

(defn- element
  "A stand-in for a children container: only its box is read."
  [top bottom]
  #js {:getBoundingClientRect (fn [] #js {:top top :bottom bottom})})

(defn- with-viewport-height
  [height f]
  (let [original (.-innerHeight js/window)]
    (set! (.-innerHeight js/window) height)
    (try
      (f)
      (finally
        (set! (.-innerHeight js/window) original)))))

(deftest near-block-viewport-mounts-only-rows-on-screen-before-paint-test
  (with-viewport-height
    700
    (fn []
      (testing "a subtree that reaches into the viewport mounts before paint"
        (is (#'block/near-block-viewport? (element 200 900)))
        (is (#'block/near-block-viewport? (element 699 1000))))
      (testing "a subtree below the fold waits for the observer, even within the margin"
        (is (not (#'block/near-block-viewport? (element 700 900))))
        (is (not (#'block/near-block-viewport? (element 1500 1800)))))
      (testing "a subtree above the viewport keeps the margin, so scrolled content above does not shift"
        (is (#'block/near-block-viewport? (element -1500 -300)))
        (is (not (#'block/near-block-viewport? (element -3000 -1300)))))
      (testing "no element"
        (is (not (#'block/near-block-viewport? nil)))))))

(deftest lazy-children-observer-root-is-the-scroll-container-test
  (let [el #js {}
        inside #js {:contains (fn [x] (identical? x el))}
        elsewhere #js {:contains (fn [_] false)}]
    (testing "the scroll container holding the subtree is the observer root, so the margin applies inside it"
      (with-redefs [util/app-scroll-container-node (fn [_] inside)]
        (is (identical? inside (#'block/lazy-children-observer-root el)))))
    (testing "a container that does not hold the subtree falls back to the implicit root"
      (with-redefs [util/app-scroll-container-node (fn [_] elsewhere)]
        (is (nil? (#'block/lazy-children-observer-root el)))))
    (testing "the subtree itself is never its own root"
      (with-redefs [util/app-scroll-container-node (fn [_] el)]
        (is (nil? (#'block/lazy-children-observer-root el)))))
    (testing "no scroll container"
      (with-redefs [util/app-scroll-container-node (fn [_] nil)]
        (is (nil? (#'block/lazy-children-observer-root el)))))))
