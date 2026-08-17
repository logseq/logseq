(ns frontend.handler.events.rtc-error
  "RTC event error helpers."
  (:require [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]))

(def ^:private e2ee-decrypt-error-codes
  #{:db-sync/invalid-e2ee-password})

(def ^:private generic-download-wrapper-messages
  #{"db-sync download failed"})

(def ^:private download-failure-detail-max-length 280)

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

(defn- download-failure-stage
  [error]
  (when error
    (let [data (ex-data error)]
      (or (:stage data)
          (download-failure-stage (:error data))
          (download-failure-stage (ex-cause error))))))

(defn- non-blank-texts
  [error]
  (->> (error-texts error)
       (keep identity)
       (map str)
       (map string/trim)
       (remove string/blank?)
       distinct))

(defn- sanitize-download-failure-detail
  [detail]
  (when (seq detail)
    (let [normalized (-> detail
                         (string/replace #"\s+" " ")
                         string/trim)]
      (when (seq normalized)
        (subs normalized 0 (min (count normalized) download-failure-detail-max-length))))))

(defn download-failure-detail
  "Short user-facing detail for a graph download failure: failed stage plus
  underlying message, without wrapper text or stacks."
  [error]
  (when error
    (let [stage (some-> (download-failure-stage error) name)
          texts (non-blank-texts error)
          preferred (->> texts
                         (remove generic-download-wrapper-messages)
                         (take 2)
                         vec)
          chosen (if (seq preferred)
                   preferred
                   (vec (take 1 texts)))
          parts (cond-> []
                  (seq stage) (conj stage)
                  (seq chosen) (into chosen))]
      (sanitize-download-failure-detail (string/join ": " parts)))))

(defn notify-download-failure!
  "Clear download progress UI and show a user-visible error toast."
  [graph-uuid error]
  (state/pub-event!
   [:rtc/log {:type :rtc.log/download
              :sub-type :download-completed
              :graph-uuid graph-uuid
              :message "Graph snapshot download failed"}])
  (notification/show!
   (if (e2ee-decrypt-failed? error)
     (i18n/t :encryption/wrong-password)
     (i18n/t :sync/download-error
             (or (download-failure-detail error)
                 (throwable-message error))))
   :error
   false)
  nil)
