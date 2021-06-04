(ns frontend.error
  (:require [clojure.string :as string]))

(defonce ignored
  #{"ResizeObserver loop limit exceeded"})

(defn ignored?
  [message]
  (let [message (str message)]
    (boolean
     (some
      ;; TODO: some cases might need regex check
      #(= (string/lower-case message) (string/lower-case %))
      ignored))))
