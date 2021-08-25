(ns electron.state
  (:require [clojure.core.async :as async]
            [electron.configs :as config]))

(defonce persistent-dbs-chan (async/chan 1))

(defonce state
  (atom {:graph/current nil
         :git/auto-commit-interval nil

         :config (config/get-config)}))

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
  (get-in @state [:config :git/disable-auto-commit?]))
