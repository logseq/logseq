(ns capacitor.state
  (:require [frontend.rum :as r]))

(defonce *nav-root (atom nil))

(defn use-nav-root [] (r/use-atom *nav-root))
