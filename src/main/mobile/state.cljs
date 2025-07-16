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

(defonce *singleton-modal (atom nil))
(defn set-singleton-modal!
  [data]
  (reset! *singleton-modal data))
(defn open-block-modal!
  [block]
  (set-singleton-modal! {:open? true
                         :block block}))
(defn use-singleton-modal [] (r/use-atom *singleton-modal))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data))

(defn redirect-to-tab! [name]
  (some-> @*tabs-el (.select name)))
