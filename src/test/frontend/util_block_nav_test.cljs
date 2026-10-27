(ns frontend.util-block-nav-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :as util]))

(deftest previous-block-of-a-missing-block-is-nil
  (testing "Up at the top of a code block whose block element is gone asks for the previous block of nil"
    ;; one block on the page, as a minimal element; the requested block itself is nil
    (let [element #js {:getAttribute (fn [_] nil)
                       :getBoundingClientRect (fn [] #js {:top 0})
                       :classList #js {:contains (fn [_] false)}}]
      (with-redefs [util/get-blocks-noncollapse (fn [& _] #js [element])]
        (is (nil? (util/get-prev-block-non-collapsed nil {:up-down? true})))
        (is (nil? (util/get-prev-block-non-collapsed nil {:up-down? true :exclude-property? true})))
        (is (nil? (util/get-next-block-non-collapsed nil {:up-down? true})))))))
