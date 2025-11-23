(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]
            [frontend.state :as state]))

(defonce *tab (atom "home"))
(defn set-tab! [tab] (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))
(defonce *search-input (atom ""))
(defn use-search-input []
  (r/use-atom *search-input))
(defonce *search-last-input-at (atom nil))
(defn use-search-last-input-at []
  (r/use-atom *search-last-input-at))

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
  (when (seq @*blocks-navigation-history)
    (let [stack (swap! *blocks-navigation-history pop)]
      (when (seq stack)
        (reset! *modal-blocks [(last stack)])))))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data)
  (when data
    (state/pub-event! [:mobile/clear-edit])))

(defn close-popup!
  []
  (set-popup! nil))

(defn quick-add-open?
  []
  (= :ls-quick-add (get-in @*popup-data [:opts :id])))

(defn redirect-to-tab! [name]
  (set-tab! (str name)))

(defonce *log (atom []))
(defn log-append!
  [record]
  (swap! *log conj record)
  (when (> (count @*log) 1000)
    (reset! *log (subvec @*log 800))))
