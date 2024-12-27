(ns frontend.flows
  "This ns contains some event flows."
  (:require [missionary.core :as m]))

(def *current-repo (atom nil))

(def current-repo-flow
  "Like get-current-repo."
  (m/eduction
   (dedupe)
   (m/watch *current-repo)))
