(ns logseq.graph-parser.import-profile
  "Lightweight import profiling and watchdog helpers for file-graph import."
  (:require [promesa.core :as p]))

(defn now-ms
  []
  (js/Date.now))

(defn elapsed-ms
  [start-ms]
  (- (now-ms) start-ms))

(defn log-phase!
  ([log-fn phase start-ms]
   (log-phase! log-fn phase start-ms nil))
  ([log-fn phase start-ms extra]
   (when log-fn
     (log-fn :import-profile
             (cond-> {:phase phase
                      :ms (elapsed-ms start-ms)}
               (map? extra) (merge extra))))))

(defn new-watchdog
  [{:keys [timeout-ms heartbeat-ms log-fn]
    :or {timeout-ms 30000
         heartbeat-ms 5000
         log-fn prn}}]
  {:timeout-ms timeout-ms
   :heartbeat-ms heartbeat-ms
   :log-fn log-fn
   :state (atom {:start-ms (now-ms)
                 :step :init
                 :phase nil
                 :file nil
                 :file-idx nil
                 :total-files nil})})

(defn snapshot
  [{:keys [state]}]
  (let [{:keys [start-ms step phase file file-idx total-files]} @state]
    {:elapsed-ms (elapsed-ms start-ms)
     :step (or step :unknown)
     :phase phase
     :file file
     :file-idx file-idx
     :total-files total-files}))

(defn update-watchdog!
  [{:keys [state]} m]
  (swap! state merge m))

(defn set-import-progress!
  [options m]
  (when-let [watchdog (:import-watchdog options)]
    (update-watchdog! watchdog m)))

(defn- log-watchdog-event!
  [{:keys [log-fn] :as watchdog} event extra]
  (when log-fn
    (log-fn event (merge (snapshot watchdog) extra))))

(defn start-watchdog!
  [{:keys [heartbeat-ms state] :as watchdog}]
  (when-not (:timer-id @state)
    (let [timer-id (js/setInterval #(log-watchdog-event! watchdog :import-heartbeat nil)
                                   heartbeat-ms)]
      (swap! state assoc :timer-id timer-id))))

(defn stop-watchdog!
  [{:keys [state]}]
  (when-let [timer-id (:timer-id @state)]
    (js/clearInterval timer-id)
    (swap! state dissoc :timer-id)))

(defn with-import-watchdog
  ([promise watchdog]
   (with-import-watchdog promise watchdog nil))
  ([promise watchdog on-timeout]
   (if watchdog
     (do
       (start-watchdog! watchdog)
       (-> promise
           (p/timeout (:timeout-ms watchdog))
           (p/catch (fn [e]
                      (log-watchdog-event! watchdog :import-timeout
                                           {:error (.-message e)
                                            :timeout-ms (:timeout-ms watchdog)})
                      (when on-timeout (on-timeout watchdog))
                      (p/rejected (ex-info (str "Import timed out after "
                                                (:timeout-ms watchdog)
                                                "ms at step="
                                                (:step (snapshot watchdog))
                                                " phase="
                                                (or (:phase (snapshot watchdog)) "nil")
                                                " file="
                                                (or (:file (snapshot watchdog)) "nil"))
                                           (snapshot watchdog)
                                           e))))
           (p/finally #(stop-watchdog! watchdog))))
     promise)))
