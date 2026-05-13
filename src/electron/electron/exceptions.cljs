(ns electron.exceptions
  (:require [electron.logger :as logger]
            [electron.utils :as utils]))

(defonce uncaughtExceptionChan "uncaughtException")

(defn- app-uncaught-handler
  [^js e]
  (let [msg (.-message e)
        stack (.-stack e)]
    (utils/send-to-renderer "notification"
                            {:type      "error"
                             :payload   (str "[Main Exception]\n" msg "\n" stack)
                             :i18n-key  :electron/main-exception
                             :i18n-args [msg stack]}))

  ;; for debug log
  (logger/error uncaughtExceptionChan (str e)))

(defn setup-exception-listeners!
  []
  (js/process.on uncaughtExceptionChan app-uncaught-handler)
  #(js/process.off uncaughtExceptionChan app-uncaught-handler))
