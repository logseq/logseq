(ns frontend.worker.rtc.log
  "Fns to generate rtc related logs"
  (:require [frontend.common.missionary-util :as c.m]
            [frontend.schema-register :as sr]
            [frontend.worker.util :as worker-util]
            [malli.core :as ma]
            [missionary.core :as m]))

(def ^:private *rtc-log (atom nil))

(sr/defkeyword :rtc.log/upload
  "rtc log type for upload-graph.")

(sr/defkeyword :rtc.log/download
  "rtc log type for upload-graph.")

(def ^:private rtc-log-type-schema
  [:enum
   :rtc.log/upload
   :rtc.log/download
   :rtc.log/cancelled
   :rtc.log/apply-remote-update
   :rtc.log/push-local-update])

(def ^:private rtc-log-type-validator (ma/validator rtc-log-type-schema))

(defn rtc-log
  [type m]
  {:pre [(map? m) (rtc-log-type-validator type)]}
  (reset! *rtc-log (assoc m :type type :created-at (js/Date.)))
  nil)

(def rtc-log-flow (m/watch *rtc-log))

;;; subscribe-logs, push to frontend
(defonce ^:private *last-subscribe-logs-canceler (atom nil))
(defn- subscribe-logs
  []
  (when-let [canceler @*last-subscribe-logs-canceler]
    (canceler)
    (reset! *last-subscribe-logs-canceler nil))
  (let [cancel (c.m/run-task
                (m/reduce
                 (fn [_ v] (when v (worker-util/post-message :rtc-log v)))
                 rtc-log-flow)
                :subscribe-logs)]
    (reset! *last-subscribe-logs-canceler cancel)
    nil))
(subscribe-logs)
