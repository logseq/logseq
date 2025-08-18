(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]))

(defonce *tab (atom "home"))
(defn set-tab! [tab] (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))

(defonce *modal-blocks (atom []))
(defn open-block-modal!
  [block]
  (when block
    (if (= 3 (count @*modal-blocks))    ; sheet stack max 3 items
      (reset! *modal-blocks (conj (vec (butlast @*modal-blocks)) block))
      (swap! *modal-blocks conj block))))

(defn close-block-modal!
  "Close top block sheet"
  [block]
  (when (and block (= (:db/id block)
                      (:db/id (last @*modal-blocks))))
    (swap! *modal-blocks pop)))

(defn clear-blocks-modal!
  []
  (reset! *modal-blocks []))

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
