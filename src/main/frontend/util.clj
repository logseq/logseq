(ns frontend.util)

;; Copied from https://github.com/tonsky/datascript-todo
(defmacro profile [k & body]
  `(if goog.DEBUG
     (let [k# ~k]
       (.time js/console k#)
       (let [res# (do ~@body)]
         (.timeEnd js/console k#)
         res#))
     (do ~@body)))

;; TODO: profile and profileEnd
