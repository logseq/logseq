(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]))

(defonce *tab (atom "home"))
(defn set-tab! [tab] (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))

(defonce *singleton-modal (atom nil))
(defn set-singleton-modal! [data] (reset! *singleton-modal data))
(defn open-block-modal!
  [block]
  (set-singleton-modal! {:open? true
                         :block block}))
(defn use-singleton-modal [] (r/use-atom *singleton-modal))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data))

(defonce *left-sidebar-open? (atom false))

(defn toggle-left-sidebar!
  []
  (swap! *left-sidebar-open? not))

(defn close-left-sidebar!
  []
  (reset! *left-sidebar-open? false))

(defn redirect-to-tab! [name]
  (set-tab! (str name)))
