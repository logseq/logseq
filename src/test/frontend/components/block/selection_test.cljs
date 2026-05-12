(ns frontend.components.block.selection-test
  (:require [cljs.test :refer [are deftest is]]
            [frontend.components.block.selection :as selection]))

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
