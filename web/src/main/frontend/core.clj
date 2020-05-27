(ns frontend.core)

;; Copied from https://github.com/tonsky/datascript-todo
(defmacro profile [k & body]
  `(let [k# ~k]
     (.time js/console k#)
     (let [res# (do ~@body)]
       (.timeEnd js/console k#)
       res#)))
