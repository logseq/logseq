(ns frontend.error
  "Error related utility fns"
  (:require [clojure.string :as string]))

(def ignored
  #{"ResizeObserver loop limit exceeded"
    "ResizeObserver loop completed with undelivered notifications"
    "Uncaught TypeError:"})

(defn ignored?
  [message]
  (let [message (str message)]
    (boolean
     (some
      ;; TODO: some cases might need regex check
      #(string/starts-with? (string/lower-case message) (string/lower-case %))
      ignored))))

(defn graph-absent-error?
  "True when a graph worker/runtime failed because the graph is gone."
  [error]
  (let [code (or (:code (ex-data error))
                 (some-> error .-code)
                 (some-> (ex-cause error) ex-data :code)
                 (some-> error .-cause .-code))]
    (contains? #{:graph-not-exists "graph-not-exists"} code)))
