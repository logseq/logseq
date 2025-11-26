(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]
            [frontend.state :as state]))

(defonce *tab (atom "home"))
(defn set-tab! [tab]
  (reset! *tab tab))
(defn use-tab [] (r/use-atom *tab))
(defonce *search-input (atom ""))
(defn use-search-input []
  (r/use-atom *search-input))
(defonce *search-last-input-at (atom nil))
(defn use-search-last-input-at []
  (r/use-atom *search-last-input-at))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data)
  (when data
    (state/pub-event! [:mobile/clear-edit])))

(defn quick-add-open?
  []
  (= :ls-quick-add (get-in @*popup-data [:opts :id])))

(defonce *log (atom []))
(defn log-append!
  [record]
  (swap! *log conj record)
  (when (> (count @*log) 1000)
    (reset! *log (subvec @*log 800))))
