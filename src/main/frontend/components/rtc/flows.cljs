(ns frontend.components.rtc.flows
  (:require [frontend.state :as state]
            [missionary.core :as m]))

(def rtc-log-flow
  (m/watch (:rtc/log @state/state)))

(def rtc-download-log-flow
  (m/eduction
   (filter #(= :rtc/download (:type %)))
   rtc-log-flow))

(def rtc-upload-log-flow
  (m/eduction
   (filter #(= :rtc/upload (:type %)))
   rtc-log-flow))

(def rtc-misc-log-flow
  (m/eduction
   (remove #(contains? #{:rtc/download :rtc/upload} (:type %)))
   rtc-log-flow))
