(ns frontend.extensions.graph-pixi-logic-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.graph.pixi.logic :as logic]))

(deftest visibility-state-uses-hysteresis
  (let [thresholds {:show-detail-scale 1.0
                    :hide-detail-scale 0.8
                    :show-label-scale 1.3
                    :hide-label-scale 1.1}
        initial {:detail-expanded? false
                 :label-visible? false}
        expanded (logic/next-visibility-state initial 1.05 thresholds)
        sticky (logic/next-visibility-state expanded 0.92 thresholds)
        collapsed (logic/next-visibility-state sticky 0.75 thresholds)
        labels-on (logic/next-visibility-state expanded 1.35 thresholds)
        labels-sticky (logic/next-visibility-state labels-on 1.2 thresholds)
        labels-off (logic/next-visibility-state labels-sticky 1.05 thresholds)]
    (testing "Detail layer expands only after crossing show threshold"
      (is (= {:detail-expanded? true :label-visible? false}
             expanded)))
    (testing "Detail state stays expanded inside hysteresis window"
      (is (= {:detail-expanded? true :label-visible? false}
             sticky)))
    (testing "Detail layer collapses after crossing hide threshold"
      (is (= {:detail-expanded? false :label-visible? false}
             collapsed)))
    (testing "Labels also use hysteresis to avoid flicker"
      (is (= {:detail-expanded? true :label-visible? true}
             labels-on))
      (is (= {:detail-expanded? true :label-visible? true}
             labels-sticky))
      (is (= {:detail-expanded? true :label-visible? false}
             labels-off)))))

(deftest select-label-node-ids-culls-overlap-and-prioritizes-tags
  (let [nodes [{:id "tag-a" :kind "tag" :degree 10 :x 100 :y 120 :label "Tag A"}
               {:id "obj-a" :kind "object" :degree 20 :x 108 :y 122 :label "Object A"}
               {:id "obj-b" :kind "object" :degree 5 :x 310 :y 210 :label "Object B"}
               {:id "obj-c" :kind "object" :degree 5 :x 900 :y 900 :label "Offscreen"}
               {:id "no-label" :kind "tag" :degree 99 :x 120 :y 120 :label nil}]
        ids (logic/select-label-node-ids nodes
                                         {:viewport {:min-x 0 :min-y 0 :max-x 500 :max-y 400}
                                          :transform {:scale 1.4 :x 0 :y 0}
                                          :screen-cell-width 140
                                          :screen-cell-height 26
                                          :max-labels 20})]
    (testing "Tag keeps the overlapping label slot over non-tag nodes"
      (is (= "tag-a" (first ids)))
      (is (not (some #{"obj-a"} ids))))
    (testing "Visible non-overlapping nodes still get labels"
      (is (some #{"obj-b"} ids)))
    (testing "Offscreen and empty labels are ignored"
      (is (not (some #{"obj-c"} ids)))
      (is (not (some #{"no-label"} ids))))))

(deftest select-label-node-ids-respects-max-label-cap
  (let [nodes (mapv (fn [idx]
                      {:id (str "node-" idx)
                       :kind (if (zero? (mod idx 7)) "tag" "object")
                       :degree (- 500 idx)
                       :x (+ 10 (* idx 30))
                       :y (+ 10 (* (mod idx 8) 40))
                       :label (str "Node " idx)})
                    (range 400))
        ids (logic/select-label-node-ids nodes
                                         {:viewport {:min-x 0 :min-y 0 :max-x 2000 :max-y 1200}
                                          :transform {:scale 1.2 :x 0 :y 0}
                                          :screen-cell-width 120
                                          :screen-cell-height 24
                                          :max-labels 60})]
    (is (= 60 (count ids)))))

(deftest label-text-defaults-to-short-and-expands-on-hover
  (let [label "This is a very long title for a graph node label"
        short-text (logic/label-display-text label false)
        hover-text (logic/label-display-text label true)]
    (is (= "This is a very long..." short-text))
    (is (= label hover-text))
    (is (= "Short" (logic/label-display-text "Short" false)))))
