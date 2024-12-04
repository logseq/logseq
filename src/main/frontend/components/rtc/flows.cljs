(ns frontend.components.rtc.flows
  (:require [frontend.common.missionary-util :as c.m]
            [frontend.state :as state]
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
