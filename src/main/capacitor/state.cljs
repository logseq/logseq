(ns capacitor.state
  (:require [frontend.rum :as r]))

(defonce *tab (atom "home"))
(defn set-tab!
  [tab]
  (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))

(defonce *modal-data (atom nil))
(defn set-modal!
  [data]
  (reset! *modal-data data))
(defn open-block-modal!
  [block]
  (set-modal! {:open? true
               :block block}))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data))
