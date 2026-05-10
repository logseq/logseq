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

(defn render-container-deps
  [opts]
  [(:nodes opts)
   (:links opts)
   (:dark? opts)
   (:view-mode opts)
   (:width opts)
   (:height opts)
   (:aria-label opts)
   (:grid-layout? opts)
   (:on-node-activate opts)
   (:on-node-preview opts)
   (:on-selection-change opts)
   (:on-rendered opts)])

(defn- schedule-render-container!
  [container opts]
  (let [timeout-id (js/setTimeout #(pixi/render-container! container opts) 0)]
    #(js/clearTimeout timeout-id)))

(rum/defc graph-2d
  [opts]
  (let [container-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (let [container (hooks/deref container-ref)]
         (when container
           (schedule-render-container! container opts))))
     (render-container-deps opts))
    (hooks/use-effect!
     (fn []
       (fn []
         (when-let [container (hooks/deref container-ref)]
           (pixi/destroy-instance! container))))
     [])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (pixi/update-visibility! container
                                  (:visible-node-ids opts)
                                  (:background-visible-node-ids opts))))
     [(:visible-node-ids opts) (:background-visible-node-ids opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (pixi/update-depth! container (:depth opts))))
     [(:depth opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (pixi/update-link-distance! container (:link-distance opts))))
     [(:link-distance opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (pixi/update-edge-display! container
                                    (:show-arrows? opts)
                                    (:show-edge-labels? opts))))
     [(:show-arrows? opts) (:show-edge-labels? opts)])
    [:div.graph-canvas
     {:ref container-ref
      :style (canvas-style opts)
      :role "application"
      :tabIndex 0
      :aria-label (:aria-label opts)}]))
