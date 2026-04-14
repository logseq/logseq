;; src/main/frontend/components/memo/graph_view.cljs
(ns frontend.components.memo.graph-view
  (:require [rum.core :as rum]
            [frontend.modules.memo.graph :as graph]
            [frontend.modules.memo.graph :refer [type->color]]
            ["d3-force"
             :refer [forceLink forceManyBody forceSimulation forceCenter]
             :as d3-force]
            [cljs-bean.core :as bean]))

(defn setting-color [type]
  (get type->color type "gray"))

(defn- render-graph [container graph-data]
  (when (and container graph-data)
    (let [width 600
          height 400
          nodes (:nodes graph-data)
          links (:links graph-data)]

      (when (and nodes links)
        (let [nodes-js (bean/->js nodes)
              links-js (bean/->js links)
              simulation (forceSimulation nodes-js)]

          ;; Set up force simulation
          (-> simulation
              (.force "link" (-> (forceLink)
                                 (.id #(.id %))
                                 (.distance 100)
                                 (.links links-js)))
              (.force "charge" (-> (forceManyBody)
                                  (.strength -300)))
              (.force "center" (forceCenter (/ width 2) (/ height 2)))
              (.velocityDecay 0.5))

          ;; Clear previous SVG content
          (set! (.-innerHTML container) "")

          ;; Create SVG element
          (let [svg (.createElementNS js/document "http://www.w3.org/2000/svg" "svg")]
            (.setAttribute svg "width" width)
            (.setAttribute svg "height" height)
            (.appendChild container svg)

            ;; Create link elements
            (doseq [link links]
              (let [line (.createElementNS js/document "http://www.w3.org/2000/svg" "line")]
                (.setAttribute line "stroke" "#999")
                (.setAttribute line "stroke-width" "2")
                (.setAttribute line "data-source" (str (:source link)))
                (.setAttribute line "data-target" (str (:target link)))
                (.appendChild svg line)))

            ;; Create node groups with circles and labels
            (doseq [node nodes]
              (let [g (.createElementNS js/document "http://www.w3.org/2000/svg" "g")
                    circle (.createElementNS js/document "http://www.w3.org/2000/svg" "circle")
                    text (.createElementNS js/document "http://www.w3.org/2000/svg" "text")]
                (.setAttribute circle "r" "10")
                (.setAttribute circle "fill" (or (:color node) (setting-color (:type node))))
                (.setAttribute text "font-size" "12px")
                (.setAttribute text "dx" "15")
                (.setAttribute text "dy" ".35em")
                (set! (.-textContent text) (:label node))
                (.appendChild g circle)
                (.appendChild g text)
                (.setAttribute g "data-id" (str (:id node)))
                (.appendChild svg g)

                ;; Add drag behavior
                (.addEventListener g "mousedown" (fn [event]
                                                    (.stopPropagation event)
                                                    (let [offset-x (- (.-clientX event) (.-x node))
                                                          offset-y (- (.-clientY event) (.-y node))]
                                                      (set! (.-fx node) (.-x node))
                                                      (set! (.-fy node) (.-y node))
                                                      (let [move-handler (fn [e]
                                                                          (let [new-x (- (.-clientX e) offset-x)
                                                                                new-y (- (.-clientY e) offset-y)]
                                                                            (set! (.-fx node) new-x)
                                                                            (set! (.-fy node) new-y)
                                                                            (set! (.-x node) new-x)
                                                                            (set! (.-y node) new-y)))]
                                                        (let [up-handler (fn []
                                                                           (.removeEventListener js/document "mousemove" move-handler)
                                                                           (.removeEventListener js/document "mouseup" up-handler)
                                                                           (set! (.-fx node) nil)
                                                                           (set! (.-fy node) nil))]
                                                          (.addEventListener js/document "mousemove" move-handler)
                                                          (.addEventListener js/document "mouseup" up-handler))))))))

          ;; Update positions on tick
          (.on simulation "tick"
               (fn []
                 (let [node-map (reduce (fn [m n] (assoc m (str (.-id n)) n)) {} nodes-js)]
                   (doseq [g (.querySelectorAll container "[data-id]")]
                     (let [node-id (.getAttribute g "data-id")
                           node (get node-map node-id)]
                       (when node
                         (.setAttribute g "transform" (str "translate(" (.-x node) "," (.-y node) ")"))))
                   (doseq [line (.querySelectorAll container "line[data-source]")]
                     (let [source-id (.getAttribute line "data-source")
                           target-id (.getAttribute line "data-target")
                           source-node (get node-map source-id)
                           target-node (get node-map target-id)]
                       (when (and source-node target-node)
                         (.setAttribute line "x1" (.-x source-node))
                         (.setAttribute line "y1" (.-y source-node))
                         (.setAttribute line "x2" (.-x target-node))
                         (.setAttribute line "y2" (.-y target-node)))))))))))))

(rum/defcs memo-graph-view < rum/reactive
  {:did-mount (fn [state]
                (let [container (.getElementById js/document "memo-graph-canvas")]
                  (render-graph container (graph/build-setting-graph)))
                state)
   :did-update (fn [state]
                 (let [container (.getElementById js/document "memo-graph-canvas")]
                   (render-graph container (graph/build-setting-graph)))
                 state)}
  [state]
  [:div.memo-graph-view
   [:div.graph-header "SimpleMem 设定图谱"]
   [:div.graph-controls
    [:button "全部"]
    (for [type [:character :world :timeline :location :custom]]
      [:button {:key type} (name type)])]
   [:div.graph-canvas {:id "memo-graph-canvas"}]])