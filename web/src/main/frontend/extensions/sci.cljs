(ns frontend.extensions.sci
  (:require [sci.core :as sci]))

;; #+begin_src clojure :results
;; (+ 1 4)
;; #+end_src

;; TODO: lazy load extensions

(def eval-string sci/eval-string)
