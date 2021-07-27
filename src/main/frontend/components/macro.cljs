(ns frontend.components.macro)


(def macros
  "Register extended macros here."
  (atom {}))

(defn register
  "(FN config options) return Hiccup"
  [macro-name fn]
  (swap! macros assoc macro-name fn))
