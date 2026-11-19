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

(defn- error-message
  [error]
  (or (ex-message error)
      (some-> error .-message)
      (str error)))

(defn graph-absent-error?
  "True when a graph worker/runtime failed because the graph is gone.

  Electron `ipcRenderer.invoke` reconstructs rejected errors from their
  message; custom `.code` and ex-data may not survive the IPC boundary."
  [error]
  (let [code (or (:code (ex-data error))
                 (some-> error .-code)
                 (some-> (ex-cause error) ex-data :code)
                 (some-> error .-cause .-code))
        message (error-message error)]
    (or (contains? #{:graph-not-exists "graph-not-exists"} code)
        (and (string? message)
             (string/includes? message "absent or stopped by deletion")))))
