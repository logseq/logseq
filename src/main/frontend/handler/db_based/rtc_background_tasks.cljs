(ns frontend.handler.db-based.rtc-background-tasks
  "Background tasks related to RTC"
  (:require [cljs-time.core :as t]
            [frontend.common.missionary :as c.m]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [missionary.core :as m]))

(defn- run-background-task-when-not-publishing
  [key' task]
  (when-not config/publishing?
    (c.m/run-background-task key' task)))

(run-background-task-when-not-publishing
 ;; try to restart rtc-loop when possible,
 ;; triggered by `rtc-flows/rtc-try-restart-flow`
 ::restart-rtc-to-reconnect
 (m/reduce
  (constantly nil)
  (m/ap
    (let [{:keys [graph-uuid t]} (m/?> rtc-flows/rtc-try-restart-flow)]
      (when (and graph-uuid t
                 (= graph-uuid (ldb/get-graph-rtc-uuid (db/get-db)))
                 (> 5000 (- (common-util/time-ms) t)))
        (log/info :trying-to-restart-rtc graph-uuid :t (t/now))
        (c.m/<? (rtc-handler/<rtc-start! (state/get-current-repo) :stop-before-start? false)))))))

(run-background-task-when-not-publishing
 ::notify-client-need-upgrade-when-larger-remote-schema-version-exists
 (m/reduce
  (constantly nil)
  (m/ap
    (let [{:keys [repo graph-uuid remote-schema-version sub-type]}
          (m/?>
           (m/eduction
            (filter #(keyword-identical? :rtc.log/higher-remote-schema-version-exists (:type %)))
            rtc-flows/rtc-log-flow))]
      (case sub-type
        :download
        (rtc-handler/notification-download-higher-schema-graph! repo graph-uuid remote-schema-version)
         ;; else
        (notification/show!
         "The server has a graph with a higher schema version, the client may need to upgrade."
         :warning))))))

(run-background-task-when-not-publishing
 ;; stop rtc when [graph-switch user-logout]
 ::stop-rtc-if-needed
 (m/reduce
  (constantly nil)
  (m/ap
    (let [logout-or-graph-switch (m/?> rtc-flows/logout-or-graph-switch-flow)]
      (log/info :try-to-stop-rtc-if-needed logout-or-graph-switch)
      (c.m/<? (rtc-handler/<rtc-stop!))))))

(run-background-task-when-not-publishing
 ;; auto-start rtc when [user-login graph-switch]
 ::auto-start-rtc-if-possible
 (m/reduce
  (constantly nil)
  (m/ap
    (let [[start-reason repo] (m/?> rtc-flows/trigger-start-rtc-flow)]
      (log/info :try-to-start-rtc [start-reason repo])
      (c.m/<? (rtc-handler/<rtc-start! (or repo (state/get-current-repo))))))))
