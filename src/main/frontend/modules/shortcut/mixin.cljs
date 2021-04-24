(ns frontend.modules.shortcut.mixin
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn before [f shortcut-map]
  (reduce-kv (fn [r k v]
               (assoc r k (f v)))
             {}
             shortcut-map))

;; middleware for before function
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

(defn only-enable-when-dev!
  [_]
  (boolean config/dev?))
