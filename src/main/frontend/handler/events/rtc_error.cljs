(ns frontend.handler.events.rtc-error
  "RTC event error helpers."
  (:require [clojure.string :as string]))

(defn- throwable-message
  [error]
  (or (ex-message error)
      (when (instance? js/Error error)
        (.-message error))
      (some-> error str)))

(defn- error-texts
  [error]
  (when error
    (let [data (ex-data error)]
      (concat
       [(throwable-message error)
        (:error-message data)
        (:error-cause data)]
       (error-texts (:error data))
       (error-texts (ex-cause error))))))

(defn download-decrypt-failed?
  [error]
  (boolean
   (some (fn [text]
           (and (string? text)
                (or (string/includes? text "decrypt-aes-key")
                    (string/includes? text "decrypt-private-key"))))
         (error-texts error))))
