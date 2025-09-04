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
  (if (seq @*blocks-navigation-history)
    (let [stack (swap! *blocks-navigation-history pop)]
      (if (empty? stack)
        (close-block-modal!)
        (reset! *modal-blocks [(last stack)])))
    (close-block-modal!)))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data))

(defonce *left-sidebar-open? (atom false))

(defn open-left-sidebar!
  []
  (reset! *left-sidebar-open? true))

(defn close-left-sidebar!
  []
  (reset! *left-sidebar-open? false))

(defn left-sidebar-open?
  []
  @*left-sidebar-open?)

(defn redirect-to-tab! [name]
  (set-tab! (str name)))
