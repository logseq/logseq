(ns frontend.extensions.sci
  (:require [sci.core :as sci]))

;; #+begin_src clojure :results
;; (+ 1 4)
;; #+end_src

;; TODO: lazy load extensions

(defn ^:export eval-string
  [code]
  (sci/eval-string code))
