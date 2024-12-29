(ns frontend.flows
  "This ns contains some event flows."
  (:require [missionary.core :as m]))

;; Some Input Atoms
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def *current-repo (atom nil))

;; Public Flows
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def current-repo-flow
  "Like get-current-repo."
  (m/eduction
   (dedupe)
   (m/watch *current-repo)))
