(ns frontend.macros
  #?(:cljs (:require-macros [frontend.macros])))

#?(:clj
   (defmacro slurped
     "Like slurp, but at compile time"
     [filename]
     (slurp filename)))
