(ns frontend.extensions.graph-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.extensions.graph :as graph]))

(def base-opts
  {:nodes []
   :links []
   :dark? false
   :view-mode :tags-and-objects
   :width 640
   :height 480
   :aria-label "Graph"
   :show-arrows? false
   :show-edge-labels? true
   :grid-layout? true
   :on-node-activate identity
   :on-node-preview identity
   :on-selection-change identity
   :on-rendered identity})

(deftest edge-display-settings-do-not-rebuild-pixi-container
  (let [base-deps (graph/render-container-deps base-opts)]
    (is (= base-deps
           (graph/render-container-deps
            (assoc base-opts
                   :show-arrows? true
                   :show-edge-labels? false))))))

(deftest interaction-callback-changes-do-not-rebuild-pixi-container
  (let [base-deps (graph/render-container-deps base-opts)]
    (is (= base-deps
           (graph/render-container-deps
            (assoc base-opts
                   :on-node-activate (fn [_node _event])
                   :on-node-preview (fn [_node _event])
                   :on-selection-change (fn [_nodes])
                   :on-rendered (fn [_render-info])))))))

(deftest grid-layout-changes-rebuild-pixi-container
  (let [base-deps (graph/render-container-deps base-opts)]
    (is (not= base-deps
              (graph/render-container-deps
               (assoc base-opts :grid-layout? false))))))
