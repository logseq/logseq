(ns frontend.modules.shortcut.mixin
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn state-f [k]
  (fn [] (get @state/components k)))

;; FIXME: remove timeout, or remove the whole bind
(defn bind-state [k]
  {:after-render
   (fn [state]
     (js/setTimeout
      (fn []
        (swap! state/components assoc k state))
      5)
     state)

   :did-remount
   (fn [_ new-state]
     (swap! state/components assoc k new-state)
     new-state)

   ;; Otherwise, (state/auto-complete?) will always be true
   :will-unmount
   (fn [state]
     (js/setTimeout
      (fn []
        (swap! state/components dissoc k))
      10)
     state)})

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

(defn enable-when-block-editing!
  [f]
  (fn [e]
    (when (state/editing?)
      (f e)
      false)))

(defn enable-when-component!
  [component-k]
  (fn [f]
    (fn [e]
      (when ((state-f component-k))
        (f e)
        false))))
