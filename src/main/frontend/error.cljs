(ns frontend.error
  "Error related utility fns"
  (:require [clojure.string :as string]))

(def ignored
  #{"ResizeObserver loop limit exceeded"
    "Uncaught TypeError:"})

(defn ignored?
  [message]
  (let [message (str message)]
    (boolean
     (some
      ;; TODO: some cases might need regex check
      #(string/starts-with? (string/lower-case message) (string/lower-case %))
      ignored))))
