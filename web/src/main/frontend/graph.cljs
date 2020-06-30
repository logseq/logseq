(ns frontend.graph
  (:require [frontend.handler :as handler]
            [frontend.util :as util]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]))

(defn- build-graph-opts
  [graph dark? option]
  (merge
   {:graphData (bean/->js graph)

    :onNodeClick (fn [node]
                   (let [page-name (string/lower-case (gobj/get node "id"))]
                     (handler/redirect! {:to :page
                                         :path-params {:name (util/url-encode page-name)}})))
    :nodeCanvasObject
    (fn [node ^CanvasRenderingContext2D ctx global-scale]
      (let [label (gobj/get node "id")
            font-size (/ 14 global-scale)
            _ (set! (.-font ctx)
                    (str font-size "px Inter"))
            text-width (gobj/get (.measureText ctx label) "width")
            bg-dimensions (mapv
                           (fn [n] (+ n (* font-size 0.2)))
                           [text-width font-size])
            x (- (gobj/get node "x") 1)
            y (- (gobj/get node "y") 1)
            [new-text-width new-font-size] bg-dimensions]
        (set! (.-fillStyle ctx) "transparent")
        (.fillRect ctx
                   (- x (/ new-text-width 2))
                   (- y (/ new-font-size 2))
                   new-text-width
                   new-font-size)
        (set! (.-filltextAlign ctx)
              "center")
        (set! (.-textBaseLine ctx)
              "middle")
        (set! (.-fillStyle ctx)
              (gobj/get node "color"))
        (.fillText ctx label (gobj/get node "x") (gobj/get node "y"))
        (.beginPath ctx)
        (.arc ctx x y 0.5 0 (* 2 js/Math.PI) false)
        (set! (.-fillStyle ctx) (if dark? "#aaa" "#222"))
        (.fill ctx)))}
   option))
