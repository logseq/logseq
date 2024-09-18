(ns frontend.extensions.fsrs
  (:require [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]))


(defn fsrs-card->property-fsrs-state
  [fsrs-card]
  (-> fsrs-card
      (update :last-repeat #(js/Date. %))
      (update :due #(js/Date. %))))
