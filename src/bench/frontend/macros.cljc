(ns frontend.macros
  #?(:cljs (:require-macros [frontend.macros])
     :clj (:require [clojure.edn :as edn])))

#?(:clj
   (defmacro slurped
     "Like slurp, but at compile time"
     [filename]
     (slurp filename)))
