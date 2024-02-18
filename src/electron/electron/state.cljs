(ns electron.state
  (:require [clojure.core.async :as async]
            [electron.configs :as config]
            [medley.core :as medley]))

(defonce persistent-dbs-chan (async/chan 1))

(defonce state
  (atom {:config (config/get-config)

         ;; window -> current graph
         :window/graph {}

         ;; job to do when persistGraph is done on renderer
         :window/once-persist-done nil

         ;; job to do when graph is loaded on renderer
         :window/once-graph-ready nil}))

(defn set-state!
  [path value]
  (if (vector? path)
    (swap! state assoc-in path value)
    (swap! state assoc path value)))

(defn get-git-commit-seconds
  []
  (get-in @state [:config :git/auto-commit-seconds] 60))

(defn git-auto-commit-enabled?
  []
  ;; For backward compatibility, use negative logic
  (false? (get-in @state [:config :git/disable-auto-commit?] true)))

(defn git-commit-on-close-enabled?
  []
  (get-in @state [:config :git/commit-on-close?] false))

(defn get-window-graph-path
  "Get the path of the graph of a window (might be `nil`)"
  [window]
  (get (:window/graph @state) window))

(defn get-all-graph-paths
  "Get the paths of all graphs currently open in all windows."
  []
  (set (vals (:window/graph @state))))

(defn get-active-window-graph-path
  "Get the path of the graph of the currently focused window (might be `nil`)"
  []
  (let [windows (:window/graph @state)
        active-windows-pairs (filter #(.isFocused (first %)) windows)
        active-window-pair (first active-windows-pairs)
        path (second active-window-pair)]
    path)
  )

(defn close-window!
  [window]
  (swap! state medley/dissoc-in [:window/graph window]))
