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

(deftest connected-drag-weights-attenuates-by-depth
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        weights (logic/connected-drag-weights neighbor-map "a"
                                              {:max-depth 2
                                               :decay 0.5
                                               :min-weight 0.2})]
    (is (= 1.0 (get weights "a")))
    (is (= 0.5 (get weights "b")))
    (is (= 0.5 (get weights "c")))
    (is (= 0.25 (get weights "d")))
    (is (nil? (get weights "e")))))

(deftest merge-node-positions-updates-drag-preview-layout
  (let [layout-by-id {"a" {:id "a" :x 0 :y 0}
                      "b" {:id "b" :x 10 :y 10}}
        result (logic/merge-node-positions
                layout-by-id
                {"a" {:x 25 :y 30}
                 "missing" {:x 5 :y 6}})]
    (is (= {:id "a" :x 25 :y 30} (get result "a")))
    (is (= {:id "b" :x 10 :y 10} (get result "b")))
    (is (not (contains? result "missing")))))

(deftest current-layout-prefers-drag-preview-for-label-positioning
  (let [committed {"a" {:id "a" :x 0 :y 0}}
        preview {"a" {:id "a" :x 50 :y 60}}]
    (is (= preview (logic/current-layout-by-id committed preview)))
    (is (= committed (logic/current-layout-by-id committed nil)))))

(deftest layout-tick-count-scales-with-graph-size
  (testing "Small graphs still get enough settling passes"
    (is (= 160 (logic/layout-tick-count 80 :all-pages))))
  (testing "Medium all-pages graphs avoid the old fixed 220 tick cost"
    (is (= 90 (logic/layout-tick-count 643 :all-pages))))
  (testing "Large graphs stay bounded"
    (is (= 70 (logic/layout-tick-count 2500 :all-pages)))))

(deftest layout-mode-switches-to-fast-layout-for-large-graphs
  (is (= :force (logic/layout-mode 2500 :all-pages)))
  (is (= :force (logic/layout-mode 2200 :tags-and-objects)))
  (is (= :fast (logic/layout-mode 3887 :tags-and-objects)))
  (is (= :fast (logic/layout-mode 50000 :all-pages))))

(deftest draw-edge-limit-is-bounded-for-large-graphs
  (is (= 712 (logic/draw-edge-limit 643 712 :all-pages)))
  (is (= 8000 (logic/draw-edge-limit 50000 120000 :all-pages))))

(deftest render-node-limit-is-bounded-for-large-graphs
  (is (= 643 (logic/render-node-limit 643 :all-pages)))
  (is (= 12000 (logic/render-node-limit 50000 :all-pages))))

(deftest label-render-state-does-not-expand-labels-while-fading-out
  (testing "Zoomed-in labels are shown without hover"
    (is (= {:target-alpha 1.0
            :update? true
            :hovered-only? false}
           (logic/label-render-state nil {:label-visible? true} 0.0))))
  (testing "Nearby hover shows only the focused label while zoom labels are hidden"
    (is (= {:target-alpha 1.0
            :update? true
            :hovered-only? true}
           (logic/label-render-state "node-a" {:label-visible? false} 0.0))))
  (testing "Fading alpha without hover does not recalculate normal label candidates"
    (is (= {:target-alpha 0.0
            :update? false
            :hovered-only? true}
           (logic/label-render-state nil {:label-visible? false} 0.35)))))

(deftest layout-nodes-uses-link-forces
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "obj-linked" :kind "object" :label "Linked object"}
               {:id "obj-island" :kind "object" :label "Island object"}]
        links [{:source "obj-linked" :target "tag-a"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        by-id (into {} (map (juxt :id identity) layouted))
        distance (fn [a b]
                   (let [a* (get by-id a)
                         b* (get by-id b)
                         dx (- (:x a*) (:x b*))
                         dy (- (:y a*) (:y b*))]
                     (js/Math.sqrt (+ (* dx dx) (* dy dy)))))]
    (is (= 3 (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                layouted))
    (is (< (distance "tag-a" "obj-linked")
           (distance "tag-a" "obj-island")))))

(deftest layout-nodes-ignores-links-with-missing-nodes
  (let [nodes [{:id 168 :kind "page" :label "Existing page"}
               {:id 169 :kind "page" :label "Linked page"}]
        links [{:source 168 :target 169}
               {:source 168 :target 170}]
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= #{168 169} (set (map :id layouted))))
    (is (= 1 (:degree (get by-id 168))))
    (is (= 1 (:degree (get by-id 169))))))

(deftest layout-nodes-large-graph-uses-fast-path
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Page " idx)})
                    (range 50000))
        links (mapv (fn [idx]
                      {:source idx
                       :target (mod (inc idx) 50000)})
                    (range 50000))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :all-pages false)
        elapsed (- (.now js/performance) start)
        sample (take 100 layouted)]
    (is (= 50000 (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                sample))
    (is (< elapsed 1000))))

(deftest layout-nodes-medium-tags-and-objects-uses-fast-clustered-path
  (let [tag-count 12
        object-count 3875
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapv (fn [idx]
                        {:id (str "obj-" idx)
                         :kind "object"
                         :label (str "Object " idx)})
                      (range object-count))
        nodes (into tags objects)
        links (mapv (fn [idx]
                      {:source (str "obj-" idx)
                       :target (str "tag-" (mod idx tag-count))})
                    (range object-count))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        elapsed (- (.now js/performance) start)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= (+ tag-count object-count) (count layouted)))
    (is (every? #(and (number? (:x %))
                      (number? (:y %))
                      (number? (:degree %))
                      (number? (:radius %))
                      (number? (:color-int %)))
                (take 200 layouted)))
    (is (< elapsed 1000))
    (is (< (js/Math.abs (:x (get by-id "tag-0"))) 900))
    (is (< (js/Math.abs (:y (get by-id "tag-0"))) 900))))
