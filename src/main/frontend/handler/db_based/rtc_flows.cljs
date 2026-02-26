(ns frontend.handler.db-based.rtc-flows
  "Flows related to RTC"
  (:require [frontend.common.missionary :as c.m]
            [frontend.flows :as flows]
            [frontend.mobile.flows :as mobile-flows]
            [frontend.state :as state]
            [logseq.common.util :as common-util]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(def rtc-log-flow
  (->> (m/watch (:rtc/log @state/state))
       (m/eduction
        (remove #(and (= :skip (:sub-type %))
                      (= :rtc.log/apply-remote-update (:type %)))))))

(def rtc-download-log-flow
  (m/eduction
   (filter #(keyword-identical? :rtc.log/download (:type %)))
   rtc-log-flow))

(def rtc-upload-log-flow
  (m/eduction
   (filter #(keyword-identical? :rtc.log/upload (:type %)))
   rtc-log-flow))

(def rtc-misc-log-flow
  (m/eduction
   (remove #(contains? #{:rtc.log/download :rtc.log/upload} (:type %)))
   rtc-log-flow))

(def rtc-state-flow
  (m/watch (:rtc/state @state/state)))

(def rtc-running-flow
  (m/eduction (map :rtc-lock) rtc-state-flow))

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

(def rtc-try-restart-flow
  "emit an event when it's time to restart rtc loop.
conditions:
- user logged in
- no rtc loop running now
- last rtc stop-reason is websocket message timeout
- online
- throttle 5000ms"
  (->> (m/latest
        (fn [rtc-state online? login-user]
          (assoc rtc-state :login-user login-user :online? online?))
        rtc-state-flow
        flows/network-online-event-flow
        flows/current-login-user-flow)
       (m/eduction
        (keep (fn [m]
                (let [{:keys [rtc-lock last-stop-exception-ex-data graph-uuid login-user online?]} m]
                  (when (and online?
                             (some? (:email login-user))
                             (some? graph-uuid)
                             (not rtc-lock) ; no rtc loop now
                             (= :rtc.exception/ws-timeout (:type last-stop-exception-ex-data)))
                    {:graph-uuid graph-uuid :t (common-util/time-ms)})))))
       (c.m/throttle 5000)))

(def logout-or-graph-switch-flow
  (c.m/mix
   (m/eduction
    (filter #(= :logout %))
    flows/current-login-user-flow)
   (m/eduction
    (keep (fn [repo] (when repo :graph-switch)))
    flows/current-repo-flow)))

(def ^:private *rtc-start-trigger (atom nil))
(defn trigger-rtc-start
  [repo]
  (assert (some? repo))
  (reset! *rtc-start-trigger repo))

(def ^:private document-visible&rtc-not-running-flow
  (m/ap
    (let [visibility (m/?< flows/document-visibility-state-flow)]
      (try
        (if (= "visible" visibility)
          (let [rtc-lock (:rtc-lock (m/? (c.m/snapshot-of-flow rtc-state-flow)))]
            (if (not rtc-lock)
              :document-visible&rtc-not-running
              (m/amb)))
          (m/amb))
        (catch Cancelled _
          (m/amb))))))

(def ^:private network-online&rtc-not-running-flow
  (m/ap
    (let [online? (m/?< flows/network-online-event-flow)]
      (try
        (if online?
          (let [rtc-running? (m/? (c.m/snapshot-of-flow rtc-running-flow))]
            (if (not rtc-running?)
              :network-online&rtc-not-running
              (m/amb)))
          (m/amb))
        (catch Cancelled _
          (m/amb))))))

(def ^:private mobile-app-active&rtc-not-running-flow
  (m/ap
    (let [app-active? (m/?< mobile-flows/mobile-app-state-flow)]
      (try
        (if app-active?
          (let [rtc-running? (m/? (c.m/snapshot-of-flow rtc-running-flow))]
            (if (not rtc-running?)
              :mobile-app-active&rtc-not-running
              (m/amb)))
          (m/amb))
        (catch Cancelled _ (m/amb))))))

(def trigger-start-rtc-flow
  (->>
   [;; login-user changed
    (m/eduction
     (keep (fn [user] (when (:email user) [:login])))
     flows/current-login-user-flow)
    ;; repo changed
    (m/eduction
     (keep (fn [repo] (when repo [:graph-switch repo])))
     flows/current-repo-flow)
    ;; trigger-rtc by somewhere else
    (m/eduction
     (keep (fn [repo] (when repo [:trigger-rtc repo])))
     (m/watch *rtc-start-trigger))
    ;; document visibilitychange->true
    (m/eduction
     (map vector)
     document-visible&rtc-not-running-flow)
    ;; network online->true
    (m/eduction
     (map vector)
     network-online&rtc-not-running-flow)
    ;; for mobile, app active event + rtc-not-running
    (m/eduction
     (map vector)
     mobile-app-active&rtc-not-running-flow)]
   (apply c.m/mix)
   (m/latest vector flows/current-login-user-flow)
   (m/eduction (keep (fn [[current-user trigger-event]] (when current-user trigger-event))))
   (c.m/debounce 50)))
