(ns frontend.extensions.graph.pixi-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.graph.position-cache :as pc]))

(deftest capture-positions-extracts-node-positions
  (testing "captures x/y from nodes keyed by label"
    (reset! pc/*cached-node-positions {})
    (pc/capture-positions! #js [#js {:label "Page A" :x 10 :y 20}
                                #js {:label "Page B" :x 30 :y 40}])
    (is (= {"Page A" {:x 10 :y 20}
            "Page B" {:x 30 :y 40}}
           @pc/*cached-node-positions))))

(deftest capture-positions-merges-with-existing
  (testing "preserves positions for pages not in the current view"
    (reset! pc/*cached-node-positions {"Page C" {:x 100 :y 200}})
    (pc/capture-positions! #js [#js {:label "Page A" :x 50 :y 60}])
    (is (= {"Page A" {:x 50 :y 60}
            "Page C" {:x 100 :y 200}}
           @pc/*cached-node-positions)))

  (testing "overwrites position for a page already in cache"
    (reset! pc/*cached-node-positions {"Page A" {:x 1 :y 2}})
    (pc/capture-positions! #js [#js {:label "Page A" :x 99 :y 88}])
    (is (= {"Page A" {:x 99 :y 88}}
           @pc/*cached-node-positions))))

(deftest capture-positions-noop-when-nil
  (testing "does nothing when nodes is nil"
    (reset! pc/*cached-node-positions {"Page A" {:x 1 :y 2}})
    (pc/capture-positions! nil)
    (is (= {"Page A" {:x 1 :y 2}}
           @pc/*cached-node-positions))))

(deftest capture-positions-skips-invalid-nodes
  (testing "skips nodes with no label"
    (reset! pc/*cached-node-positions {})
    (pc/capture-positions! #js [#js {:x 10 :y 20}
                                #js {:label "Valid" :x 5 :y 15}])
    (is (= {"Valid" {:x 5 :y 15}}
           @pc/*cached-node-positions)))

  (testing "skips nodes with non-numeric x"
    (reset! pc/*cached-node-positions {})
    (pc/capture-positions! #js [#js {:label "Bad" :x "nope" :y 20}
                                #js {:label "Good" :x 10 :y 20}])
    (is (= {"Good" {:x 10 :y 20}}
           @pc/*cached-node-positions)))

  (testing "skips nodes with null y"
    (reset! pc/*cached-node-positions {})
    (pc/capture-positions! #js [#js {:label "Bad" :x 10 :y nil}
                                #js {:label "Good" :x 10 :y 20}])
    (is (= {"Good" {:x 10 :y 20}}
           @pc/*cached-node-positions)))

  (testing "skips nodes with undefined x and y (keys absent)"
    (reset! pc/*cached-node-positions {})
    (pc/capture-positions! #js [#js {:label "NoCoords"}
                                #js {:label "HasCoords" :x 7 :y 8}])
    (is (= {"HasCoords" {:x 7 :y 8}}
           @pc/*cached-node-positions))))

(deftest capture-positions-empty-nodes-array
  (testing "no-op with an empty nodes array"
    (reset! pc/*cached-node-positions {"Existing" {:x 1 :y 2}})
    (pc/capture-positions! #js [])
    (is (= {"Existing" {:x 1 :y 2}}
           @pc/*cached-node-positions))))
