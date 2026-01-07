(ns frontend.handler.db-based.sync
  "Dispatch RTC calls between legacy RTC and worker-sync implementations."
  (:require [frontend.config :as config]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.worker-sync :as worker-sync-handler]))

(defn- worker-sync-enabled? []
  config/worker-sync-enabled?)

(defn <rtc-create-graph! [repo]
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-create-graph! repo)
    (rtc-handler/<rtc-create-graph! repo)))

(defn <rtc-delete-graph! [graph-uuid schema-version]
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-delete-graph! graph-uuid schema-version)
    (rtc-handler/<rtc-delete-graph! graph-uuid schema-version)))

(defn <rtc-download-graph! [graph-name graph-uuid graph-schema-version timeout-ms]
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-download-graph! graph-name graph-uuid graph-schema-version timeout-ms)
    (rtc-handler/<rtc-download-graph! graph-name graph-uuid graph-schema-version timeout-ms)))

(defn <rtc-stop! []
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-stop!)
    (rtc-handler/<rtc-stop!)))

(defn <rtc-branch-graph! [repo]
  (rtc-handler/<rtc-branch-graph! repo))

(defn notification-download-higher-schema-graph! [graph-name graph-uuid schema-version]
  (rtc-handler/notification-download-higher-schema-graph! graph-name graph-uuid schema-version))

(defn <rtc-get-users-info []
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-get-users-info)
    (rtc-handler/<rtc-get-users-info)))

(defn <rtc-start!
  [repo & {:keys [stop-before-start?] :or {stop-before-start? true}}]
  (if (worker-sync-enabled?)
    (worker-sync-handler/<rtc-start! repo :stop-before-start? stop-before-start?)
    (rtc-handler/<rtc-start! repo :stop-before-start? stop-before-start?)))

(defn <get-remote-graphs []
  (if (worker-sync-enabled?)
    (worker-sync-handler/<get-remote-graphs)
    (rtc-handler/<get-remote-graphs)))

(defn <rtc-invite-email [graph-uuid email]
  (rtc-handler/<rtc-invite-email graph-uuid email))
