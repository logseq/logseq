(ns frontend.react-impls
  "Support different react implements.")

;; Remove rum *reactions* assert

(defn rum-react
  "Works in conjunction with [[reactive]] mixin. Use this function instead of `deref` inside render, and your component will subscribe to changes happening to the derefed atom."
  [ref]
  (when rum.core/*reactions*
    (vswap! rum.core/*reactions* conj ref))
  (and ref @ref))

(def react (atom rum-react))
