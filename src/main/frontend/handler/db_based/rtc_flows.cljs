(ns frontend.handler.db-based.rtc-flows
  "Flows related to RTC"
  (:require [frontend.state :as state]
            [frontend.common.missionary :as c.m]
            [logseq.common.util :as common-util]
            [missionary.core :as m]))

(def rtc-log-flow
  (m/watch (:rtc/log @state/state)))

(def rtc-download-log-flow
  (m/eduction
   (filter #(= :rtc.log/download (:type %)))
   rtc-log-flow))

(def rtc-upload-log-flow
  (m/eduction
   (filter #(= :rtc.log/upload (:type %)))
   rtc-log-flow))

(def rtc-misc-log-flow
  (m/eduction
   (remove #(contains? #{:rtc.log/download :rtc.log/upload} (:type %)))
   rtc-log-flow))

(def rtc-state-flow
  (m/stream (m/watch (:rtc/state @state/state))))

(def rtc-online-users-flow
  (c.m/throttle
   500
   (m/eduction
    (map (fn [m]
           (when (and (= :open (:ws-state (:rtc-state m)))
                      (:rtc-lock m))
             (:online-users m))))
    (dedupe)
    rtc-state-flow)))

(def ^:private network-online-change-flow
  (m/stream
   (m/relieve
    (m/observe
     (fn ctor [emit!]
       (let [origin-callback js/window.ononline]
         (set! js/window.ononline emit!)
         (emit! nil)
         (fn dtor []
           (set! js/window.ononline origin-callback))))))))

(def rtc-try-restart-flow
  "emit an event when it's time to restart rtc loop.
conditions:
1. no rtc loop running now
2. last rtc stop-reason is websocket message timeout
3. current js/navigator.onLine=true
5. throttle 5000ms"
  (->> (m/latest
        (fn [rtc-state _] rtc-state)
        (c.m/continue-flow rtc-state-flow) (c.m/continue-flow network-online-change-flow))
       (m/eduction
        (keep (fn [m]
                (let [{:keys [rtc-lock last-stop-exception-ex-data graph-uuid]} m]
                  (when (and (some? graph-uuid)
                             (not rtc-lock) ; no rtc loop now
                             (= :rtc.exception/ws-timeout (:type last-stop-exception-ex-data))
                             (true? js/navigator.onLine))
                    {:graph-uuid graph-uuid :t (common-util/time-ms)})))))
       (c.m/throttle 5000)))
