(ns electron.daily-journal
  (:require ["electron" :refer [BrowserWindow powerMonitor]]
            [cljs-bean.core :as bean]))

(defonce ^:private *state (atom nil))

(defn next-local-day-ms
  ([]
   (next-local-day-ms (js/Date.)))
  ([^js now]
   (.getTime (js/Date. (.getFullYear now) (.getMonth now) (inc (.getDate now)) 0 0 1))))

(defn- schedule-delay-ms
  [target-ms]
  (max 1000 (- target-ms (.now js/Date))))

(defn resume-due?
  [now-ms target-ms]
  (>= now-ms (or target-ms 0)))

(defn- resume-action
  [now-ms target-ms]
  (if (and target-ms
           (not (resume-due? now-ms target-ms)))
    :keep-target
    :notify-renderers))

(defn- notify-renderers! []
  (doseq [^js win (.getAllWindows BrowserWindow)]
    (.. win -webContents
        (send "createTodayJournal" (bean/->js nil)))))

(defn stop! []
  (when-let [{:keys [timeout-id on-resume]} @*state]
    (when timeout-id
      (js/clearTimeout timeout-id))
    (when on-resume
      (.removeListener powerMonitor "resume" on-resume))
    (reset! *state nil)))

(defn setup! []
  (stop!)
  (letfn [(schedule-target! [target-ms]
            (let [timeout-id (js/setTimeout
                              (fn []
                                (notify-renderers!)
                                (schedule-next!))
                              (schedule-delay-ms target-ms))]
              (swap! *state assoc
                     :target-ms target-ms
                     :timeout-id timeout-id)))
          (schedule-next! []
            (schedule-target! (next-local-day-ms)))]
    (let [on-resume (fn []
                      (let [{:keys [timeout-id target-ms]} @*state]
                        (when timeout-id
                          (js/clearTimeout timeout-id))
                        (case (resume-action (.now js/Date) target-ms)
                          :keep-target
                          (schedule-target! target-ms)

                          :notify-renderers
                          (do
                            (notify-renderers!)
                            (schedule-next!)))))]
      (reset! *state {:on-resume on-resume})
      (.on powerMonitor "resume" on-resume)
      (schedule-next!)
      stop!)))
