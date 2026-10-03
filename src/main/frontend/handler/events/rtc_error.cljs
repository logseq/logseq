(ns frontend.handler.events.rtc-error
  "RTC event error helpers."
  (:require [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]))

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

(defn- error-data-value?
  [error k value]
  (when error
    (let [data (ex-data error)]
      (or (= value (get data k))
          (error-data-value? (:error data) k value)
          (error-data-value? (ex-cause error) k value)))))

(defn- worker-download-failure?
  [error]
  (some #{"db-sync download failed"} (error-texts error)))

(defn notify-download-failure!
  "Clear download progress UI and show a user-visible error toast."
  [graph-uuid error]
  (when-not (error-data-value? error :type :db-sync/graph-operation-in-progress)
    (when-not (worker-download-failure? error)
      (state/pub-event!
       [:rtc/log {:type :rtc.log/download
                  :sub-type :download-completed
                  :graph-uuid graph-uuid
                  :message "Graph snapshot download failed"}]))
    (notification/show!
     (if (e2ee-decrypt-failed? error)
       (i18n/t :encryption/wrong-password)
       (i18n/t :sync/download-error))
     :error
     false))
  nil)
