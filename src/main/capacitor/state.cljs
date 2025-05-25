(ns capacitor.state
  (:require [frontend.rum :as r]))

(defonce *nav-root (atom nil))

(defn use-nav-root [] (r/use-atom *nav-root))

(defonce *tab (atom "home"))
(defn set-tab!
  [tab]
  (reset! *tab tab))

(defn use-tab [] (r/use-atom *tab))
