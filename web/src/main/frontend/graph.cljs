(ns frontend.graph
  (:require [frontend.handler :as handler]
            [frontend.util :as util]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.state :as state]
            [frontend.db :as db]))

(defonce static-num (js/Math.pow 2 24))
(defn get-color
  [n]
  (str "#" (-> (mod (* n 1234567)
                    static-num)
               (.toString 16)
               (.padStart 6 "0"))))

(defn- build-graph-opts
  [graph dark? option]
  (merge
   {:graphData (bean/->js graph)
    :nodeLabel "id"
    :onNodeClick (fn [node event]
                   (let [page-name (string/lower-case (gobj/get node "id"))]
                     (if (gobj/get event "shiftKey")
                       (let [repo (state/get-current-repo)
                             page (db/entity repo [:page/name page-name])]
                         (state/sidebar-add-block!
                          repo
                          (:db/id page)
                          :page
                          {:page page})
                         (handler/show-right-sidebar))
                       (handler/redirect! {:to :page
                                           :path-params {:name (util/url-encode page-name)}}))))
    :nodeCanvasObject
    (fn [node ^CanvasRenderingContext2D ctx global-scale]
      (let [label (gobj/get node "id")
            x (gobj/get node "x")
            y (gobj/get node "y")
            color (gobj/get node "color")
            font-size (/ 14 global-scale)]
        (set! (.-fillStyle ctx) color)
        (set! (.-font ctx) (str font-size "px Inter"))
        (set! (.-filltextAlign ctx) "center")
        (set! (.-textBaseLine ctx) "middle")
        (.fillText ctx label x y)))}
   option))
