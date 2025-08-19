(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]))

(defonce *tab (atom "home"))
(defn set-tab! [tab] (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))

(defonce *modal-blocks (atom []))
(defonce *blocks-navigation-history (atom []))
(defn open-block-modal!
  [block]
  (when (:db/id block)
    (reset! *modal-blocks [block])
    (when-not (= (:db/id block) (:db/id (last @*blocks-navigation-history)))
      (swap! *blocks-navigation-history conj block))))

(defn close-block-modal!
  "Close top block sheet"
  []
  (reset! *modal-blocks [])
  (reset! *blocks-navigation-history []))

(defn pop-navigation-history!
  []
  (let [stack (swap! *blocks-navigation-history pop)]
    (if (empty? stack)
      (close-block-modal!)
      (reset! *modal-blocks [(last stack)]))))

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

(defn left-sidebar-open?
  []
  (not (contains? #{0 1} @*left-sidebar-detent)))

(defn redirect-to-tab! [name]
  (set-tab! (str name)))
