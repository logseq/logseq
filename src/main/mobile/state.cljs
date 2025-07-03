(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]))

(defonce *tab (atom "home"))
(defonce *tabs-el (atom nil))
(defn set-tab!
  [tab ^js tabs]
  (reset! *tab tab)
  (reset! *tabs-el tabs))
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

(defn redirect-to-tab! [name]
  (some-> @*tabs-el (.select name)))
