(ns frontend.worker.rtc.log-and-state
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


;;; some other states

(def ^:private graph-uuid->t-schema
  [:map-of :uuid :int])
(def ^:private graph-uuid->t-validator (ma/validator graph-uuid->t-schema))
(def ^:private graph-uuid->t-validator* (fn [v] (if (graph-uuid->t-validator v)
                                                  true
                                                  (do (prn :debug-graph-uuid->t-validator v)
                                                      false))))

(def *graph-uuid->local-t (atom {} :validator graph-uuid->t-validator*))
(def *graph-uuid->remote-t (atom {} :validator graph-uuid->t-validator*))

(defn- ensure-uuid
  [v]
  (cond
    (uuid? v)   v
    (string? v) (uuid v)
    :else       (throw (ex-info "illegal value" {:data v}))))

(defn create-local-t-flow
  [graph-uuid]
  (m/eduction
   (map (fn [m] (get m (ensure-uuid graph-uuid))))
   (m/watch *graph-uuid->local-t)))

(defn create-remote-t-flow
  [graph-uuid]
  {:pre [(some? graph-uuid)]}
  (m/eduction
   (map (fn [m] (get m (ensure-uuid graph-uuid))))
   (m/watch *graph-uuid->remote-t)))

(defn update-local-t
  [graph-uuid local-t]
  (swap! *graph-uuid->local-t assoc (ensure-uuid graph-uuid) local-t))

(defn update-remote-t
  [graph-uuid remote-t]
  (swap! *graph-uuid->remote-t assoc (ensure-uuid graph-uuid) remote-t))

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
