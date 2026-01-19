(ns electron.state
  (:require [electron.configs :as config]
            [medley.core :as medley]))

(defonce state
  (atom {:config (config/get-config)

         ;; window -> current graph
         :window/graph {}

         ;; job to do when graph is loaded on renderer
         :window/once-graph-ready nil}))

(defn set-state!
  [path value]
  (if (vector? path)
    (swap! state assoc-in path value)
    (swap! state assoc path value)))

(defn get-window-graph-path
  "Get the path of the graph of a window (might be `nil`)"
  [window]
  (get (:window/graph @state) window))

(defn close-window!
  [window]
  (swap! state medley/dissoc-in [:window/graph window]))
