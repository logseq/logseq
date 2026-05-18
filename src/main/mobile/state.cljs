(ns mobile.state
  "Mobile state"
  (:require [frontend.rum :as r]
            [frontend.state :as state]
            [mobile.navigation :as mobile-nav]))

(defonce *search-input (atom ""))

(defonce *tab (atom "home"))
(defn set-tab! [tab]
  (let [prev @*tab]
    ;; When leaving the search tab, clear its stack so reopening starts fresh.
    ;; Native search UI owns query/result clearing on each platform; doing it here
    ;; makes the Search UI redraw during the Home tab transition on iOS.
    (when (and (= prev "search")
               (not= tab "search"))
      (mobile-nav/reset-stack-history! "search"))
    (reset! *tab tab)
    (mobile-nav/switch-stack! tab)))
(defn use-tab [] (r/use-atom *tab))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data)
  (when data
    (state/pub-event! [:mobile/clear-edit])))

(defonce *log (atom []))
(defn log-append!
  [record]
  (swap! *log conj record)
  (when (> (count @*log) 1000)
    (reset! *log (subvec @*log 800))))

(defonce *app-launch-url (atom nil))
