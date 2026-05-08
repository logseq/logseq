(ns frontend.extensions.graph
  (:require [frontend.extensions.graph.pixi :as pixi]
            [logseq.shui.hooks :as hooks]
            [rum.core :as rum]))

(defn activate-node!
  [node event on-node-activate]
  (when (and node (fn? on-node-activate))
    (on-node-activate node event)))

(defn on-click-handler
  [_graph _node _event _focus-nodes _n-hops _drag? _dark?]
  ;; Compatibility shim for older graph view code paths.
  nil)

(defn canvas-style
  [{:keys [width height]}]
  (cond-> {:width "100%"
           :height "100%"}
    (number? width)
    (assoc :width (str width "px"))

    (number? height)
    (assoc :height (str height "px"))))

(rum/defc graph-2d
  [opts]
  (let [container-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (pixi/render-container! (hooks/deref container-ref) opts)
       (fn []
         (pixi/destroy-instance!)))
     [(:nodes opts)
      (:links opts)
      (:dark? opts)
      (:view-mode opts)
      (:width opts)
      (:height opts)
      (:on-node-activate opts)
      (:on-rendered opts)])
    [:div.graph-v2-canvas
     {:ref container-ref
      :style (canvas-style opts)}]))
