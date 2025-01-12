(ns frontend.hooks
  "React custom hooks."
  (:refer-clojure :exclude [ref deref])
  (:require [goog.functions :as gfun]
            [rum.core :as rum]))

(defn- memo-deps
  [equal-fn deps]
  (let [equal-fn (or equal-fn =)
        ^js deps-ref (rum/use-ref deps)]
    (when-not (equal-fn (.-current deps-ref) deps)
      (set! (.-current deps-ref) deps))
    (.-current deps-ref)))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-memo
  [f deps & {:keys [equal-fn]}]
  (rum/use-memo f #js[(memo-deps equal-fn deps)]))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-effect!
  "setup-fn will be invoked every render of component when no deps arg provided"
  ([setup-fn] (rum/use-effect! setup-fn))
  ([setup-fn deps & {:keys [equal-fn]}]
   (rum/use-effect! setup-fn #js[(memo-deps equal-fn deps)])))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-layout-effect!
  ([setup-fn] (rum/use-layout-effect! setup-fn))
  ([setup-fn deps & {:keys [equal-fn]}]
   (rum/use-layout-effect! setup-fn #js[(memo-deps equal-fn deps)])))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-callback
  [callback deps & {:keys [equal-fn]}]
  (rum/use-callback callback #js[(memo-deps equal-fn deps)]))

;;; unchanged hooks, link to rum/use-xxx directly
(def use-ref rum/use-ref)
(def create-ref rum/create-ref)
(def deref rum/deref)
(def set-ref! rum/set-ref!)
(def use-state rum/use-state)
(comment
  (def use-reducer rum/use-reducer))

;;; other custom hooks

(defn use-debounced-value
  "Return the debounced value"
  [value msec]
  (let [[debounced-value set-value!] (use-state value)
        cb (use-callback (gfun/debounce set-value! msec) [])]
    (use-effect! #(cb value) [value])
    debounced-value))
