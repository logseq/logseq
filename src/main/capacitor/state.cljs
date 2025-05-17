(ns capacitor.state
  (:require [frontend.rum :as r]))

(defonce *nav-root (atom nil))
(defonce *state
  (atom {:version 0
         :last-modified-page-uuid nil}))

(defn use-nav-root [] (r/use-atom *nav-root))
(defn use-app-state
  ([] (r/use-atom *state))
  ([ks] (r/use-atom-in *state ks)))


