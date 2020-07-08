(ns frontend.extensions.graph-2d
  (:require [rum.core :as rum]
            [frontend.loader :as loader]
            [frontend.components.widgets :as widgets]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.rum :as r]))

;; TODO: extracted to a rum mixin
(defn loaded? []
  js/window.ForceGraph
  )

(defonce graph-component
  (atom nil))

(defonce *loading? (atom true))

(rum/defc graph < rum/reactive
  {:init (fn [state]
           (if @graph-component
             (reset! *loading? false)
             (do
               (loader/load
                (config/asset-uri "/static/js/react-force-graph.min.js")
                (fn []
                  (reset! graph-component
                          (r/adapt-class (gobj/get js/window.ForceGraph "ForceGraph2D")))
                  (reset! *loading? false)))))
                state)}
  [opts]
  (let [loading? (rum/react *loading?)]
    (if loading?
      (widgets/loading "Loading")
      (when @graph-component
        (@graph-component
         opts)))))
