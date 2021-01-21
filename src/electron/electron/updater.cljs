(ns electron.updater
  (:require ["electron" :refer [ipcMain]]
            [promesa.core :as p]))

(def *update-pending (atom nil))

(defn check-for-updates
  [{:keys [repo ^js logger ^js win]}]
  (let [debug (partial (.-warn logger) "[updater]")
        emit (fn [type payload]
               (.. win -webContents
                   (send "updates-callback" #js {:type type :payload payload})))]
    (debug "check for updates #" repo)
    (emit "update-ok" 1))
  (p/resolved nil))

(defn init-updater
  [{:keys [repo logger] :as opts}]
  (let [channel "check-for-updates"
        listener (fn [e & args]
                   (when-not @*update-pending
                     (reset! *update-pending true)
                     (p/finally
                       (check-for-updates (merge opts {:args args}))
                       #(reset! *update-pending nil))))]
    (.handle ipcMain channel listener)
    #(do (.removeHandler ipcMain channel) (reset! *update-pending nil))))
