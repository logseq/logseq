(ns frontend.components.tag
  (:require [frontend.components.reference :as reference]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.state :as state]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler :as handler]
            [frontend.util :as util]))

(defn- get-tag
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(rum/defcs tag < rum/reactive
  [state]
  (when-let [tag (get-tag state)]
    [:div.tag
     [:h1.title (str "#" tag)]
     (reference/references tag true false)]))

(defn- build-graph-opts
  [graph dark?]
  {:graphData (bean/->js graph)
   :onNodeClick (fn [node]
                  (let [tag-name (string/lower-case (gobj/get node "id"))]
                    (handler/redirect! {:to :tag
                                        :path-params {:name (util/url-encode tag-name)}})))
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
           x (gobj/get node "x")
           y (gobj/get node "y")
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
       (.fillText ctx label (gobj/get node "x") (gobj/get node "y"))))})

(rum/defc all-tags < rum/reactive
  []
  (let [theme (state/sub :ui/theme)
        dark? (= theme "dark")
        tags (db/get-all-tags)
        nodes (mapv (fn [[tag refs]]
                      (cond->
                          {:id tag
                           :name tag
                           :val refs
                           :color "#222222"}
                        dark?
                        (assoc :color "#dfdfdf")))
                    tags)
        links []
        graph {:nodes nodes
               :links links}]
    [:div.all-tags
     [:div.flex-1.flex-col
      [:div#tags-graph {:style {:height "100vh"}}
       (ui/force-graph-2d (build-graph-opts graph dark?))]]]))
