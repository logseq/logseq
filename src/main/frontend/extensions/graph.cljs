(ns frontend.extensions.graph
  (:require [frontend.extensions.graph.pixi :as pixi]
            [logseq.shui.hooks :as hooks]
            [rum.core :as rum]))

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
       (let [container (hooks/deref container-ref)]
         (pixi/render-container! container opts)
         (fn []
           (pixi/destroy-instance! container))))
     [(:nodes opts)
      (:links opts)
      (:dark? opts)
      (:view-mode opts)
      (:width opts)
      (:height opts)
      (:aria-label opts)
      (:on-node-activate opts)
      (:on-selection-change opts)
      (:on-rendered opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (pixi/update-visibility! container (:visible-node-ids opts))))
     [(:visible-node-ids opts)])
    [:div.graph-canvas
     {:ref container-ref
      :style (canvas-style opts)
      :role "application"
      :tabIndex 0
      :aria-label (:aria-label opts)}]))
