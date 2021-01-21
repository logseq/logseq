(ns electron.handler
  (:require ["electron" :refer [ipcMain]]))

(defn set-ipc-handler! [window]
  (.handle ipcMain "main"
           (fn [event args-js]
             (prn "receive event: " args-js)
             args-js)))
