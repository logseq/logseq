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
   (:grid-layout? opts)])

(defn- schedule-render-container!
  [container opts]
  (let [animation-frame-id* (atom nil)
        timeout-id* (atom nil)
        render! #(reset! timeout-id*
                         (js/setTimeout
                          (fn []
                            (reset! timeout-id* nil)
                            (pixi/render-container! container opts))
                          0))]
    (if (exists? js/requestAnimationFrame)
      (reset! animation-frame-id*
              (js/requestAnimationFrame
               (fn []
                 (reset! animation-frame-id* nil)
                 (render!))))
      (render!))
    (fn []
      (when-let [animation-frame-id @animation-frame-id*]
        (js/cancelAnimationFrame animation-frame-id))
      (when-let [timeout-id @timeout-id*]
        (js/clearTimeout timeout-id)))))

(rum/defc graph-2d
  [opts]
  (let [container-ref (hooks/use-ref nil)
        render-pending-ref (hooks/use-ref false)
        on-node-activate-ref (hooks/use-ref nil)
        on-node-preview-ref (hooks/use-ref nil)
        on-selection-change-ref (hooks/use-ref nil)
        on-focus-change-ref (hooks/use-ref nil)
        on-rendered-ref (hooks/use-ref nil)
        incremental-update-ready? (fn [container]
                                    (and container
                                         (not (hooks/deref render-pending-ref))))
        activate-node! (fn [node event]
                         (when-let [handler (hooks/deref on-node-activate-ref)]
                           (handler node event)))
        preview-node! (fn [node event]
                        (when-let [handler (hooks/deref on-node-preview-ref)]
                          (handler node event)))
        change-selection! (fn [nodes]
                            (when-let [handler (hooks/deref on-selection-change-ref)]
                              (handler nodes)))
        change-focus! (fn [node]
                        (when-let [handler (hooks/deref on-focus-change-ref)]
                          (handler node)))
        rendered! (fn [render-info]
                    (hooks/set-ref! render-pending-ref false)
                    (when-let [handler (hooks/deref on-rendered-ref)]
                      (handler render-info)))]
    (hooks/set-ref! on-node-activate-ref (:on-node-activate opts))
    (hooks/set-ref! on-node-preview-ref (:on-node-preview opts))
    (hooks/set-ref! on-selection-change-ref (:on-selection-change opts))
    (hooks/set-ref! on-focus-change-ref (:on-focus-change opts))
    (hooks/set-ref! on-rendered-ref (:on-rendered opts))
    (hooks/use-effect!
     (fn []
       (let [container (hooks/deref container-ref)]
         (when container
           (hooks/set-ref! render-pending-ref true)
           (schedule-render-container!
            container
            (assoc opts
                   :on-node-activate activate-node!
                   :on-node-preview preview-node!
                   :on-selection-change change-selection!
                   :on-focus-change change-focus!
                   :on-rendered rendered!)))))
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
         (when (incremental-update-ready? container)
           (pixi/update-visibility! container
                                    (:visible-node-ids opts)
                                    (:background-visible-node-ids opts)))))
     [(:visible-node-ids opts) (:background-visible-node-ids opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (when (incremental-update-ready? container)
           (pixi/update-depth! container (:depth opts)))))
     [(:depth opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (when (incremental-update-ready? container)
           (pixi/update-link-distance! container (:link-distance opts)))))
     [(:link-distance opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (when (incremental-update-ready? container)
           (pixi/update-edge-display! container
                                      (:show-arrows? opts)
                                      (:show-edge-labels? opts)))))
     [(:show-arrows? opts) (:show-edge-labels? opts)])
    (hooks/use-effect!
     (fn []
       (when-let [container (hooks/deref container-ref)]
         (when (incremental-update-ready? container)
           (pixi/reset-interaction! container))))
     [(:reset-token opts)])
    [:div.graph-canvas
     {:ref container-ref
      :style (canvas-style opts)
      :role "application"
      :tabIndex 0
      :aria-label (:aria-label opts)}]))
