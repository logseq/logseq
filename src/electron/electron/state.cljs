(ns electron.state
  (:require [clojure.core.async :as async]
            [electron.configs :as config]
            [medley.core :as medley]))

(defonce persistent-dbs-chan (async/chan 1))

(defonce state
  (atom {:git/auto-commit-interval nil

         :config (config/get-config)

         ;; FIXME: replace with :window/graph
         :graph/current nil

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

(defn set-git-commit-interval!
  [v]
  (set-state! :git/auto-commit-interval v))

(defn clear-git-commit-interval!
  []
  (when-let [interval (get @state :git/auto-commit-interval)]
    (js/clearInterval interval)))

(defn get-git-commit-seconds
  []
  (get-in @state [:config :git/auto-commit-seconds] 60))

(defn git-auto-commit-disabled?
  []
  (get-in @state [:config :git/disable-auto-commit?] true))

(defn get-graph-path
  []
  (:graph/current @state))

(defn get-window-graph-path
  "Get the path of the graph of a window (might be `nil`)"
  [window]
  (get (:window/graph @state) window))

(defn close-window!
  [window]
  (swap! state medley/dissoc-in [:window/graph window]))
