(ns frontend.components.block.selection-test
  (:require [cljs.test :refer [are deftest is]]
            [frontend.components.block.selection :as selection]))

(deftest pointer-down-state-lifecycle
  (selection/clear-pointer-down!)
  (is (false? (selection/pointer-down?)))
  (selection/set-pointer-down!)
  (is (true? (selection/pointer-down?)))
  (selection/clear-pointer-down!)
  (is (false? (selection/pointer-down?)))
  (selection/set-pointer-down!)
  (selection/clear-pointer-down! #js {:type "pointerup"})
  (is (false? (selection/pointer-down?))))

(deftest select-on-hover-keeps-active-selection-while-scroll-moves-block-under-pointer
  (is (true?
       (selection/select-on-hover?
        {:last-client-y 320
         :client-y 320
         :dragging? false
         :editing-same-block? false
         :active-selection? true}))))

(deftest select-on-hover-preserves-existing-guards
  (are [expected opts] (= expected (selection/select-on-hover? opts))
    true  {:last-client-y 320
           :client-y 321
           :dragging? false
           :editing-same-block? false
           :active-selection? false}
    false {:last-client-y 320
           :client-y 320
           :dragging? false
           :editing-same-block? false
           :active-selection? false}
    false {:last-client-y 320
           :client-y 321
           :dragging? true
           :editing-same-block? false
           :active-selection? true}
    false {:last-client-y 320
           :client-y 321
           :dragging? false
           :editing-same-block? true
           :active-selection? true}))

(deftest block-id-range-uses-ordered-block-ids
  (are [expected start-block-id end-block-id]
       (= expected
          (selection/block-id-range [:a :b :c :d] start-block-id end-block-id))
    {:direction :down :block-ids [:b :c :d]} :b :d
    {:direction :up :block-ids [:d :c :b]} :d :b
    {:direction :down :block-ids [:c]} :c :c
    nil :missing :c
    nil :a :missing))

(deftest virtual-range-boundary-id-uses-the-complete-membership-order
  (let [block-ids [:empty :first :middle :last]]
    (is (= :last
           (selection/virtual-range-boundary-id block-ids :down 1 3)))
    (is (= :first
           (selection/virtual-range-boundary-id block-ids :up 1 3)))
    (is (nil?
         (selection/virtual-range-boundary-id block-ids nil 1 3)))))

(deftest unselected-block-ids-preserves-order-without-duplicate-ids
  (is (= [:d :e]
         (selection/unselected-block-ids [:a :b :c]
                                         [:b :c :d :d :e])))
  (is (= []
         (selection/unselected-block-ids [:a :b]
                                         [:a :b :a]))))
