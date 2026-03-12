(ns frontend.worker.test-env)

(when-not (exists? js/globalThis.self)
  (set! (.-self js/globalThis) js/globalThis))

(when-not (exists? (.-importScripts js/self))
  (set! (.-importScripts js/self) (fn [& _] nil)))

(when-not (exists? (.-postMessage js/self))
  (set! (.-postMessage js/self) (fn [& _] nil)))
