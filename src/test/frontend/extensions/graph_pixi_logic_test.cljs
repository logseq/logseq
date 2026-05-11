(ns frontend.extensions.graph-pixi-logic-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.graph.pixi.logic :as logic]))

(deftest visibility-state-keeps-details-visible-and-uses-label-hysteresis
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
    (testing "Detail layer stays visible while zooming"
      (is (= {:detail-expanded? true :label-visible? false}
             expanded)))
    (testing "Detail layer does not collapse below the old hide threshold"
      (is (= {:detail-expanded? true :label-visible? false}
             sticky)))
    (testing "Detail layer remains visible at small scale"
      (is (= {:detail-expanded? true :label-visible? false}
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

(deftest label-surfaces-occlude-crossing-links
  (is (= 1.0 (logic/label-surface-fill-alpha :node false)))
  (is (= 1.0 (logic/label-surface-fill-alpha :node true)))
  (is (= 1.0 (logic/label-surface-fill-alpha :edge false))))

(deftest renderer-init-options-enable-smooth-strokes
  (is (= true (:antialias (logic/renderer-init-options 2)))))

(deftest graph-ticker-targets-120-fps
  (let [ticker #js {:maxFPS 0}]
    (is (identical? ticker (logic/apply-graph-ticker-frame-rate! ticker)))
    (is (= 120 (.-maxFPS ticker)))))

(deftest edge-label-angle-stays-aligned-and-readable
  (is (= 0 (logic/readable-edge-label-angle 0 0 100 0)))
  (is (= 0 (logic/readable-edge-label-angle 100 0 0 0)))
  (is (= (/ js/Math.PI 2) (logic/readable-edge-label-angle 0 0 0 100)))
  (is (= (/ js/Math.PI -2) (logic/readable-edge-label-angle 0 100 0 0))))

(deftest edge-render-runs-separate-bidirectional-links
  (let [runs (logic/edge-render-runs [{:source "a" :target "b"}
                                      {:source "b" :target "a"}
                                      {:source "a" :target "c"}]
                                     true)]
    (is (= [true true true] (mapv :show-arrow? runs)))
    (is (not= 0 (:parallel-offset (first runs))))
    (is (= (:parallel-offset (first runs))
           (:parallel-offset (second runs))))
    (is (= 0 (:parallel-offset (nth runs 2)))))
  (is (= [false]
         (mapv :show-arrow? (logic/edge-render-runs [{:source "a" :target "b"}] false)))))

(deftest edge-render-runs-deduplicate-same-direction-links
  (let [runs (logic/edge-render-runs [{:source "tienson" :target "publish" :label "Project"}
                                      {:source "tienson" :target "publish" :label "Project"}
                                      {:source "publish" :target "tienson" :label "Lead"}]
                                     true)]
    (is (= 2 (count runs)))
    (is (= #{["tienson" "publish"] ["publish" "tienson"]}
           (set (map (juxt :source :target) runs))))
    (is (= [true true] (mapv :show-arrow? runs)))
    (is (= 1 (count (filter #(= ["tienson" "publish"]
                                ((juxt :source :target) %))
                             runs))))))

(deftest icon-display-text-renders-emoji-icons
  (is (= "⭐" (logic/icon-display-text {:type :emoji :id "star"})))
  (is (= "🚀" (logic/icon-display-text {:type "emoji" :id "rocket"})))
  (is (= "★" (logic/icon-display-text "★")))
  (is (nil? (logic/icon-display-text {:type :tabler-icon :id "star"}))))

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

(deftest highlighted-node-selection-supports-add-remove-and-one-hop-state
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b"]}
        selected (-> #{}
                     (logic/update-highlighted-node-ids "a" false)
                     (logic/update-highlighted-node-ids "d" false)
                     (logic/update-highlighted-node-ids "a" true))
        state (logic/highlight-state selected neighbor-map)]
    (is (= #{"d"} selected))
    (is (= #{"d"} (:selected-ids state)))
    (is (= #{"b"} (:connected-ids state)))
    (is (= :selected (logic/node-emphasis state "d")))
    (is (= :connected (logic/node-emphasis state "b")))
    (is (= :dimmed (logic/node-emphasis state "a")))
    (is (= :normal (logic/node-emphasis (logic/highlight-state #{} neighbor-map) "a")))))

(deftest highlighted-node-selection-respects-depth
  (let [neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        one-hop (logic/highlight-state #{"a"} neighbor-map 1)
        two-hop (logic/highlight-state #{"a"} neighbor-map 2)]
    (is (= #{"a" "b" "c"} (:active-ids one-hop)))
    (is (= #{"a" "b" "c" "d"} (:active-ids two-hop)))
    (is (= :dimmed (logic/node-emphasis one-hop "d")))
    (is (= :connected (logic/node-emphasis two-hop "d")))))

(deftest highlighted-links-hide-default-lines-and-filter-selected-neighborhood
  (let [links [{:source "a" :target "b"}
               {:source "a" :target "c"}
               {:source "b" :target "d"}
               {:source "d" :target "e"}]
        neighbor-map {"a" ["b" "c"]
                      "b" ["a" "d"]
                      "c" ["a"]
                      "d" ["b" "e"]
                      "e" ["d"]}
        state (logic/highlight-state #{"a"} neighbor-map 2)]
    (is (empty? (logic/highlight-visible-links links (logic/highlight-state #{} neighbor-map))))
    (is (= #{{:source "a" :target "b"}
             {:source "a" :target "c"}
             {:source "b" :target "d"}}
           (set (logic/highlight-visible-links links state))))))

(deftest node-click-action-distinguishes-highlight-unhighlight-and-open
  (is (= {:action :highlight
          :next-click {:node-id "a" :time 1000}}
         (logic/node-click-action nil "a" {:selected? false} 1000)))
  (is (= {:action :open
          :next-click nil}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:selected? true} 1210)))
  (is (= {:action :highlight
          :next-click {:node-id "b" :time 1210}}
         (logic/node-click-action {:node-id "a" :time 1000} "b" {:selected? false} 1210)))
  (is (= {:action :unhighlight
          :next-click {:node-id "a" :time 1400}}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:selected? true} 1400)))
  (is (= {:action :open
          :next-click nil}
         (logic/node-click-action {:node-id "a" :time 1000} "a" {:open? true} 1210))))

(deftest layout-tick-count-scales-with-graph-size
  (testing "Small graphs still get enough settling passes"
    (is (= 160 (logic/layout-tick-count 80 :all-pages))))
  (testing "Medium all-pages graphs avoid the old fixed 220 tick cost"
    (is (= 90 (logic/layout-tick-count 643 :all-pages))))
  (testing "Large tags-and-objects graphs keep d3 force under the first-render budget"
    (is (= 3 (logic/layout-tick-count 3887 :tags-and-objects))))
  (testing "Large graphs stay bounded"
    (is (= 70 (logic/layout-tick-count 2500 :all-pages)))))

(deftest layout-mode-switches-to-fast-layout-for-large-graphs
  (is (= :force (logic/layout-mode 2499 :all-pages)))
  (is (= :fast (logic/layout-mode 2500 :all-pages)))
  (is (= :force (logic/layout-mode 2200 :tags-and-objects)))
  (is (= :force (logic/layout-mode 3887 :tags-and-objects)))
  (is (= :fast (logic/layout-mode 50000 :all-pages))))

(deftest draw-edge-limit-is-bounded-for-large-graphs
  (is (= 712 (logic/draw-edge-limit 643 712 :all-pages)))
  (is (= 3600 (logic/draw-edge-limit 50000 120000 :all-pages))))

(deftest render-node-limit-is-bounded-for-large-graphs
  (is (= 643 (logic/render-node-limit 643 :all-pages)))
  (is (= 2200 (logic/render-node-limit 50000 :all-pages))))

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

(deftest label-render-state-filters-labels-in-select-mode
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? true
          :active-only? false}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? false
                                                           :linked-label-visible? false} 0.0)))
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? true
          :active-only? false}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? true
                                                           :linked-label-visible? false} 1.0)))
  (is (= {:target-alpha 1.0
          :update? true
          :hovered-only? false
          :selected-only? false
          :active-only? true}
         (logic/label-render-state nil #{"a"} #{"a" "b"} {:label-visible? true
                                                           :linked-label-visible? true} 1.0))))

(deftest fit-transform-scales-graph-into-viewport
  (let [nodes [{:x -500 :y -250 :radius 10}
               {:x 500 :y 250 :radius 10}]
        transform (logic/fit-transform nodes 1000 500 {:padding 50})]
    (is (= 0.7692307692307693 (:scale transform)))
    (is (= 500 (:x transform)))
    (is (= 250 (:y transform)))))

(deftest zoom-scale-bounds-allow-farther-zoom-out
  (is (= 0.05 logic/min-zoom-scale))
  (is (= 0.05 (logic/clamp-zoom-scale 0.01)))
  (is (= 3.6 (logic/clamp-zoom-scale 10))))

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

(deftest layout-nodes-tags-mode-assigns-clusters
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}
               {:id "obj-b" :kind "object" :label "Object B"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-b" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= "tag-a" (:cluster-id (get by-id "tag-a"))))
    (is (= "tag-a" (:cluster-id (get by-id "obj-a"))))
    (is (= "tag-b" (:cluster-id (get by-id "tag-b"))))
    (is (= "tag-b" (:cluster-id (get by-id "obj-b"))))))

(deftest layout-nodes-tags-mode-grid-layout-keeps-clusters-apart
  (let [tag-count 18
        object-count 12
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        layouted (logic/layout-nodes (vec (concat tags objects))
                                     (vec links)
                                     :tags-and-objects
                                     false
                                     {:grid-layout? true})
        backgrounds (logic/tag-cluster-backgrounds
                     layouted
                     :tags-and-objects
                     {:grid-layout? true})
        center-distance (fn [a b]
                          (let [dx (- (:x a) (:x b))
                                dy (- (:y a) (:y b))]
                            (js/Math.sqrt (+ (* dx dx) (* dy dy)))))
        width (- (apply max (map :x backgrounds))
                 (apply min (map :x backgrounds)))
        height (- (apply max (map :y backgrounds))
                  (apply min (map :y backgrounds)))]
    (is (= tag-count (count backgrounds)))
    (is (< width 2200))
    (is (< height 1800))
    (is (every? (fn [[a b]]
                  (> (center-distance a b)
                     (+ (:radius a) (:radius b) 24)))
                (for [a backgrounds
                      b backgrounds
                      :when (neg? (compare (:id a) (:id b)))]
                  [a b])))))

(deftest layout-nodes-tags-mode-can-use-relaxed-clusters
  (let [tag-count 6
        object-count 4
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        relaxed (logic/layout-nodes (vec (concat tags objects))
                                    (vec links)
                                    :tags-and-objects
                                    false
                                    {:grid-layout? false})
        by-id (into {} (map (juxt :id identity) relaxed))
        origin-distance (fn [node]
                          (js/Math.sqrt (+ (* (:x node) (:x node))
                                           (* (:y node) (:y node)))))]
    (is (some #(<= (origin-distance (get by-id (str "tag-" %))) 420)
              (range tag-count)))))

(deftest layout-nodes-tags-mode-grid-layout-duplicates-multi-tag-nodes
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-a" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false {:grid-layout? true})
        object-copies (filter #(= "obj-a" (logic/node-source-id %)) layouted)
        display-links (logic/display-links links layouted)]
    (is (= 4 (count layouted)))
    (is (= #{"tag-a" "tag-b"} (set (map :cluster-id object-copies))))
    (is (= 2 (count (set (map :id object-copies)))))
    (is (= #{{:source (logic/visual-node-id "tag-a" "obj-a") :target "tag-a"}
             {:source (logic/visual-node-id "tag-b" "obj-a") :target "tag-b"}}
           (set (map #(select-keys % [:source :target]) display-links))))))

(deftest layout-nodes-tags-mode-non-grid-keeps-single-multi-tag-node
  (let [nodes [{:id "tag-a" :kind "tag" :label "Tag A"}
               {:id "tag-b" :kind "tag" :label "Tag B"}
               {:id "obj-a" :kind "object" :label "Object A"}]
        links [{:source "obj-a" :target "tag-a"}
               {:source "obj-a" :target "tag-b"}]
        layouted (logic/layout-nodes nodes links :tags-and-objects false {:grid-layout? false})
        object-nodes (filter #(= "obj-a" (logic/node-source-id %)) layouted)]
    (is (= 3 (count layouted)))
    (is (= 1 (count object-nodes)))
    (is (= "obj-a" (:id (first object-nodes))))))

(deftest layout-nodes-tags-mode-non-grid-keeps-old-seed-shape
  (let [tag-count 8
        object-count 120
        tags (mapv (fn [idx]
                     {:id (str "tag-" idx)
                      :kind "tag"
                      :label (str "Tag " idx)})
                   (range tag-count))
        objects (mapcat (fn [tag-idx]
                          (mapv (fn [object-idx]
                                  {:id (str "obj-" tag-idx "-" object-idx)
                                   :kind "object"
                                   :label (str "Object " tag-idx "-" object-idx)})
                                (range object-count)))
                        (range tag-count))
        links (mapcat (fn [tag-idx]
                        (mapv (fn [object-idx]
                                {:source (str "obj-" tag-idx "-" object-idx)
                                 :target (str "tag-" tag-idx)})
                              (range object-count)))
                      (range tag-count))
        layouted (logic/layout-nodes (vec (concat tags objects))
                                     (vec links)
                                     :tags-and-objects
                                     false
                                     {:grid-layout? false})
        tag-radius (fn [idx]
                     (let [{:keys [x y]} (some #(when (= (str "tag-" idx) (:id %)) %) layouted)]
                       (js/Math.round (js/Math.sqrt (+ (* x x) (* y y))))))]
    (is (= 968 (count layouted)))
    (is (every? #(<= 240 (tag-radius %) 760) (range tag-count)))))

(deftest tag-cluster-backgrounds-wrap-clustered-nodes
  (let [backgrounds (logic/tag-cluster-backgrounds
                     [{:id "tag-a" :kind "tag" :cluster-id "tag-a" :x 0 :y 0 :radius 10}
                      {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 60 :y 0 :radius 8}
                      {:id "tag-b" :kind "tag" :cluster-id "tag-b" :x 300 :y 0 :radius 10}
                      {:id "obj-b" :kind "object" :cluster-id "tag-b" :x 360 :y 0 :radius 8}]
                     :tags-and-objects)]
    (is (= #{"tag-a" "tag-b"} (set (map :id backgrounds))))
    (is (every? #(>= (:radius %) 84) backgrounds))
    (is (= [] (logic/tag-cluster-backgrounds
               [{:id "tag-a" :kind "tag" :cluster-id "tag-a" :x 0 :y 0 :radius 10}]
               :all-pages)))))

(deftest tag-cluster-backgrounds-are-centered-on-tag-node
  (let [[background] (logic/tag-cluster-backgrounds
                      [{:id "tag-a" :kind "tag" :label "Tag A" :cluster-id "tag-a" :x 100 :y 80 :radius 10}
                       {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 260 :y 80 :radius 8}
                       {:id "obj-b" :kind "object" :cluster-id "tag-a" :x 100 :y 220 :radius 8}]
                      :tags-and-objects
                      {:grid-layout? true})]
    (is (= 100 (:x background)))
    (is (= 80 (:y background)))
    (is (> (:radius background) 170))))

(deftest tag-cluster-backgrounds-use-bounds-center-for-non-grid
  (let [[background] (logic/tag-cluster-backgrounds
                      [{:id "tag-a" :kind "tag" :label "Tag A" :cluster-id "tag-a" :x 100 :y 80 :radius 10}
                       {:id "obj-a" :kind "object" :cluster-id "tag-a" :x 260 :y 80 :radius 8}
                       {:id "obj-b" :kind "object" :cluster-id "tag-a" :x 100 :y 220 :radius 8}]
                      :tags-and-objects
                      {:grid-layout? false})]
    (is (= 179 (:x background)))
    (is (= 149 (:y background)))))

(deftest tag-cluster-background-colors-come-from-tag-title
  (let [backgrounds (logic/tag-cluster-backgrounds
                     [{:id "tag-a" :kind "tag" :label "Design" :cluster-id "tag-a" :x 0 :y 0 :radius 10}
                      {:id "tag-b" :kind "tag" :label "Research" :cluster-id "tag-b" :x 180 :y 0 :radius 10}
                      {:id "tag-c" :kind "tag" :label "Design" :cluster-id "tag-c" :x 360 :y 0 :radius 10}]
                     :tags-and-objects)
        color-by-id (into {} (map (juxt :id :color-int) backgrounds))]
    (is (not= (get color-by-id "tag-a")
              (get color-by-id "tag-b")))
    (is (= (get color-by-id "tag-a")
           (get color-by-id "tag-c")))))

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

(deftest layout-nodes-sizes-hubs-by-edge-count
  (let [nodes (mapv (fn [id]
                      {:id id
                       :kind "page"
                       :label (str "Page " id)})
                    ["hub" "leaf-1" "leaf-2" "leaf-3" "leaf-4" "leaf-5" "island"])
        links (mapv (fn [target]
                      {:source "hub"
                       :target target})
                    ["leaf-1" "leaf-2" "leaf-3" "leaf-4" "leaf-5"])
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= 5 (:degree (get by-id "hub"))))
    (is (<= (+ (:radius (get by-id "leaf-1")) 4.0)
            (:radius (get by-id "hub"))))
    (is (< (:radius (get by-id "island"))
           (:radius (get by-id "leaf-1"))))))

(deftest layout-nodes-fast-all-pages-keeps-degree-based-sizing
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Page " idx)})
                    (range 3000))
        links (conj (mapv (fn [target]
                            {:source 0
                             :target target})
                          (range 1 101))
                    {:source 0 :target 999999})
        layouted (logic/layout-nodes nodes links :all-pages false)
        by-id (into {} (map (juxt :id identity) layouted))]
    (is (= 3000 (count layouted)))
    (is (= 100 (:degree (get by-id 0))))
    (is (= 1 (:degree (get by-id 1))))
    (is (= 0 (:degree (get by-id 101))))
    (is (< (:radius (get by-id 1))
           (:radius (get by-id 0))))))

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
    (is (< elapsed 500))))

(deftest layout-nodes-4k-all-pages-uses-fast-path
  (let [nodes (mapv (fn [idx]
                      {:id idx
                       :kind "page"
                       :label (str "Movie " idx)})
                    (range 4000))
        links (mapv (fn [idx]
                      {:source idx
                       :target (mod (inc idx) 4000)})
                    (range 4000))
        start (.now js/performance)
        layouted (logic/layout-nodes nodes links :all-pages false)
        elapsed (- (.now js/performance) start)]
    (is (= 4000 (count layouted)))
    (is (< elapsed 250))))

(deftest layout-nodes-medium-tags-and-objects-uses-bounded-d3-force
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
    (is (< elapsed 500))
    (is (< (js/Math.abs (:x (get by-id "tag-0"))) 900))
    (is (< (js/Math.abs (:y (get by-id "tag-0"))) 900))))

(deftest layout-nodes-non-grid-tags-keeps-force-layout-controls
  (let [tag-count 8
        object-count 960
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
        compact (logic/layout-nodes nodes links :tags-and-objects false {:link-distance 40})
        loose (logic/layout-nodes nodes links :tags-and-objects false {:link-distance 140})
        compact-by-id (into {} (map (juxt :id identity) compact))
        loose-by-id (into {} (map (juxt :id identity) loose))
        compact-node (get compact-by-id "obj-100")
        loose-node (get loose-by-id "obj-100")]
    (is (not= [(:x compact-node) (:y compact-node)]
              [(:x loose-node) (:y loose-node)]))))
