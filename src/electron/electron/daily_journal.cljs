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
  []
  (max 1000 (- (next-local-day-ms) (.now js/Date))))

(defn resume-due?
  [now-ms target-ms]
  (>= now-ms (or target-ms 0)))

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
  (let [schedule! (fn schedule! []
                    (let [target-ms (next-local-day-ms)
                          timeout-id (js/setTimeout
                                      (fn []
                                        (notify-renderers!)
                                        (schedule!))
                                      (schedule-delay-ms))]
                      (swap! *state assoc
                             :target-ms target-ms
                             :timeout-id timeout-id)))
        on-resume (fn []
                    (let [{:keys [timeout-id target-ms]} @*state]
                      (when timeout-id
                        (js/clearTimeout timeout-id))
                      (when (resume-due? (.now js/Date) target-ms)
                        (notify-renderers!))
                      (schedule!)))]
    (reset! *state {:on-resume on-resume})
    (.on powerMonitor "resume" on-resume)
    (schedule!)
    stop!))
