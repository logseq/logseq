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
  (when block
    (set-singleton-modal! {:open? true
                           :block block})))
(defn use-singleton-modal [] (r/use-atom *singleton-modal))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data))

(defonce *left-sidebar-open? (atom true))
(defonce *left-sidebar-detent (atom 0))
(defonce *left-sidebar-inert-outside? (atom false))

(defn open-left-sidebar!
  []
  (reset! *left-sidebar-open? true)
  (reset! *left-sidebar-inert-outside? true)
  (reset! *left-sidebar-detent 2))

(defn close-left-sidebar!
  []
  (reset! *left-sidebar-open? false)
  (reset! *left-sidebar-inert-outside? false)
  (reset! *left-sidebar-detent 1)
  (js/setTimeout #(reset! *left-sidebar-open? true) 300))

(defn toggle-left-sidebar!
  []
  (if (contains? #{0 1} @*left-sidebar-detent)
    (open-left-sidebar!)
    (close-left-sidebar!)))

(defn left-sidebar-open?
  []
  (not (contains? #{0 1} @*left-sidebar-detent)))

(defn redirect-to-tab! [name]
  (set-tab! (str name)))
