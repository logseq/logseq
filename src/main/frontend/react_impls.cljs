(ns frontend.react-impls
  "Support different react implements."
  (:require [rum.core]))

;; Remove rum *reactions* assert

(defn rum-react
  "Works in conjunction with [[reactive]] mixin. Use this function instead of `deref` inside render, and your component will subscribe to changes happening to the derefed atom."
  [ref]
  (when (deref #'rum.core/*reactions*)
    (vswap! (deref #'rum.core/*reactions*) conj ref))
  (and ref @ref))

(def react (atom rum-react))
