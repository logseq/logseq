(ns frontend.handler.export.macro
  #?(:cljs (:require-macros [frontend.handler.export.macro :refer [binding*]])))

#?(:cljs
   #_:clj-kondo/ignore
   (defn doall-recur [s]
     (if (seq? s)
       (doall (map doall-recur
                   s))
       s)))


#?(:clj
   (defmacro binding*
     "apply recursive doall on body result"
     [bindings & body]
     `(binding ~bindings
        (doall-recur ~@body))))
