(ns frontend.extensions.graph.g6
  (:require [frontend.rum :as r]
            ["@antv/g6" :as G6]
            [goog.object :as gobj]))

(def graph (gobj/get G6 "Graph"))
(def util (gobj/get G6 "Util"))
(def arrow (gobj/get G6 "Arrow"))
