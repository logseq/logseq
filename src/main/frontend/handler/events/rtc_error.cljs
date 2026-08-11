(ns frontend.handler.events.rtc-error
  "RTC event error helpers.")

(def ^:private e2ee-decrypt-error-codes
  #{:db-sync/invalid-e2ee-password})

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

(defn- error-codes
  [error]
  (when error
    (let [data (ex-data error)]
      (concat
       [(:code data)]
       (error-codes (:error data))
       (error-codes (ex-cause error))))))

(defn e2ee-decrypt-failed?
  [error]
  (boolean
   (or (some e2ee-decrypt-error-codes (error-codes error))
       (some #{"decrypt-aes-key"} (error-texts error)))))
