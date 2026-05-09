(ns frontend.extensions.graph-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.extensions.graph :as graph]))

(deftest canvas-style-fills-available-space
  (is (= {:width "100%" :height "100%"}
         (graph/canvas-style {})))
  (is (= {:width "640px" :height "480px"}
         (graph/canvas-style {:width 640 :height 480}))))

(deftest render-container-deps-ignore-incremental-depth
  (let [opts {:nodes []
              :links []
              :dark? true
              :view-mode :tags-and-objects
              :width 640
              :height 480
              :aria-label "Graph"
              :depth 1
              :arrow-mode :both
              :link-distance 72
              :show-edge-labels? true
              :on-node-activate identity
              :on-selection-change identity
              :on-rendered identity}
        deps (graph/render-container-deps opts)]
    (is (not (some #{1} deps)))
    (is (some #{:both} deps))
    (is (some #{72} deps))))
