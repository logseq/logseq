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

(rum/defc graph-2d
  [opts]
  (let [container-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (pixi/render-container! (hooks/deref container-ref) opts))
     [(:nodes opts)
      (:links opts)
      (:dark? opts)
      (:view-mode opts)
      (:on-node-activate opts)
      (:on-rendered opts)])
    (hooks/use-effect!
     (fn []
       (fn []
         (pixi/destroy-instance!)))
     [])
    [:div.graph-v2-canvas
     {:ref container-ref}]))
