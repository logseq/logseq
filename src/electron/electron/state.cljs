(ns electron.state
  (:require [clojure.core.async :as async]))

(defonce persistent-dbs-chan (async/chan 1))

(defonce state
  (atom {:graph/current nil
         :git/auto-commit-seconds 60
         :git/auto-commit-interval nil}))

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

(defn set-git-commit-seconds!
  [v]
  (let [v (if (and (integer? v) (< 0 v (inc (* 60 10)))) ; max 10 minutes
            v
            60)]
    (set-state! :git/auto-commit-seconds v)))

(defn get-git-commit-seconds
  []
  (or (get @state :git/auto-commit-seconds) 60))
