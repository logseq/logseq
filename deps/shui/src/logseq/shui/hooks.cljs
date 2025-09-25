(ns logseq.shui.hooks
  "React custom hooks."
  (:refer-clojure :exclude [ref deref])
  (:require [frontend.common.missionary :as c.m]
            [goog.functions :as gfun]
            [missionary.core :as m]
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
  (rum/use-memo f (if (empty? deps)
                    deps
                    #js[(memo-deps equal-fn deps)])))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-effect!
  "setup-fn will be invoked every render of component when no deps arg provided"
  ([setup-fn] (rum/use-effect! setup-fn))
  ([setup-fn deps & {:keys [equal-fn]}]
   (assert (fn? setup-fn) "use-effect! setup-fn should be a function")
   (rum/use-effect! (fn [& deps]
                      (let [result (apply setup-fn deps)]
                        (when (fn? result) result)))
                    (if (empty? deps)
                      deps
                      #js[(memo-deps equal-fn deps)]))))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-layout-effect!
  ([setup-fn] (rum/use-layout-effect! setup-fn))
  ([setup-fn deps & {:keys [equal-fn]}]
   (assert (fn? setup-fn) "use-layout-effect! setup-fn should be a function")
   (rum/use-layout-effect! (fn [& deps]
                             (let [result (apply setup-fn deps)]
                               (when (fn? result) result)))
                           (if (empty? deps)
                             deps
                             #js[(memo-deps equal-fn deps)]))))

#_{:clj-kondo/ignore [:discouraged-var]}
(defn use-callback
  [callback deps & {:keys [equal-fn]}]
  (rum/use-callback callback (if (empty? deps)
                               deps
                               #js[(memo-deps equal-fn deps)])))

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

(defn use-flow-state
  "Return values from `flow`, default init-value is nil"
  ([flow] (use-flow-state nil flow []))
  ([init-value flow] (use-flow-state init-value flow []))
  ([init-value flow deps]
   (let [[value set-value!] (use-state init-value)]
     (use-effect!
      #(c.m/run-task*
        (m/reduce
         (constantly nil)
         (m/ap (set-value! (m/?> flow)))))
      deps)
     value)))

(defn- is-touch-event? [e]
  (exists? (.-touches e)))

(defn- prevent-default [e]
  (when (and (is-touch-event? e)
             (< (.-length (.-touches e)) 2)
             (.-preventDefault e))
    (.preventDefault e)))

(defn use-long-press
  [{:keys [on-click on-long-press prevent-default? delay]
    :or {prevent-default? true
         delay 300}}]
  (let [[long-press-triggered set-long-press-triggered] (use-state false)
        timeout-ref (use-ref nil)
        target-ref (use-ref nil)
        start (use-callback
               (fn [e]
                 (when (and prevent-default? (.-target e))
                   (.addEventListener (.-target e) "touchend" prevent-default #js {:passive false})
                   (set! (.-current target-ref) (.-target e)))
                 (set! (.-current timeout-ref)
                       (js/setTimeout
                        (fn []
                          (on-long-press e)
                          (set-long-press-triggered true))
                        delay)))
               [on-long-press delay prevent-default?])

        clear (use-callback
               (fn [_e should-trigger-click]
                 (when (.-current timeout-ref)
                   (js/clearTimeout (.-current timeout-ref)))
                 (when (and (or (nil? should-trigger-click) should-trigger-click)
                            (not long-press-triggered))
                   (on-click))
                 (set-long-press-triggered false)
                 (when (and prevent-default? (.-current target-ref))
                   (.removeEventListener (.-current target-ref) "touchend" prevent-default)))
               [prevent-default? on-click long-press-triggered])]

    {:onMouseDown #(start %)
     :onTouchStart #(start %)
     :onMouseUp #(clear % true)
     :onMouseLeave #(clear % false)
     :onTouchEnd #(clear % true)}))
