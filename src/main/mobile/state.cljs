(ns mobile.state
  "Mobile state"
  (:require [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [mobile.navigation :as mobile-nav]))

(defonce *search-input (atom ""))

(defonce *tab (atom "home"))

(defn set-tab! [tab]
  (let [prev @*tab
        search->home? (and (= prev "search")
                           (= tab "home"))]
    (reset! *tab tab)
    (if search->home?
      (mobile-nav/pop-to-root! tab)
      (mobile-nav/switch-stack! tab))))
(defn use-tab [] (hooks/use-atom *tab))

(defonce *popup-data (atom nil))
(defn set-popup!
  [data]
  (reset! *popup-data data)
  (when data
    (state/pub-event! [:mobile/clear-edit])))

(defonce *flashcards-header (atom nil))
(defn set-flashcards-header!
  [data]
  (reset! *flashcards-header data))

(defonce *flashcards-selector (atom nil))
(defn set-flashcards-selector!
  [data]
  (reset! *flashcards-selector data))

(defonce *log (atom []))
(defn log-append!
  [record]
  (swap! *log conj record)
  (when (> (count @*log) 1000)
    (reset! *log (subvec @*log 800))))

(defonce *app-launch-url (atom nil))
