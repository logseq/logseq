(ns frontend.modules.shortcut.before
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]))

;; before function
(defn prevent-default-behavior
  [f]
  (fn [e]
    (f e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defn enable-when-not-editing-mode!
  [f]
  (fn [e]
    (when-not (or (state/editing?)
                  (util/input? (.-target e)))
      (f e)
      false)))

(defn enable-when-editing-mode!
  [f]
  (fn [e]
    (when (state/editing?)
      (util/stop e)
      (f e))))

(defn enable-when-not-component-editing!
  [f]
  (fn [e]
    (when-not (state/block-component-editing?)
      (util/stop e)
      (f e))))

(defn only-enable-when-dev!
  [_]
  (boolean config/dev?))
