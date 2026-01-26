(ns frontend.handler.db-based.sync
  "Dispatch RTC calls between legacy RTC and db-sync implementations."
  (:require [frontend.config :as config]
            [frontend.handler.db-based.db-sync :as db-sync-handler]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- db-sync-enabled? []
  config/db-sync-enabled?)

(defn <rtc-create-graph! [repo]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-create-graph! repo)
    (rtc-handler/<rtc-create-graph! repo)))

(defn <rtc-delete-graph! [graph-uuid schema-version]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-delete-graph! graph-uuid schema-version)
    (rtc-handler/<rtc-delete-graph! graph-uuid schema-version)))

(defn <rtc-download-graph! [graph-name graph-uuid graph-schema-version timeout-ms]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-download-graph! graph-name graph-uuid graph-schema-version)
    (rtc-handler/<rtc-download-graph! graph-name graph-uuid graph-schema-version timeout-ms)))

(defn <rtc-stop! []
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-stop!)
    (rtc-handler/<rtc-stop!)))

(defn <rtc-update-presence!
  [editing-block-uuid]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-update-presence! editing-block-uuid)
    (rtc-handler/<rtc-update-presence! editing-block-uuid)))

(defn <rtc-branch-graph! [repo]
  (rtc-handler/<rtc-branch-graph! repo))

(defn notification-download-higher-schema-graph! [graph-name graph-uuid schema-version]
  (rtc-handler/notification-download-higher-schema-graph! graph-name graph-uuid schema-version))

(defn <rtc-get-users-info []
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-get-users-info)
    (rtc-handler/<rtc-get-users-info)))

(defn <rtc-start!
  [repo & {:keys [stop-before-start?] :or {stop-before-start? true}}]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-start! repo :stop-before-start? stop-before-start?)
    (rtc-handler/<rtc-start! repo :stop-before-start? stop-before-start?)))

(defn <rtc-upload-graph! [repo token remote-graph-name]
  (if (db-sync-enabled?)
    (p/let [graph-id (db-sync-handler/<rtc-create-graph! repo)]
      (when (nil? graph-id)
        (throw (ex-info "graph id doesn't exist when uploading to server" {:repo repo})))
      (p/do!
       (state/<invoke-db-worker :thread-api/db-sync-upload-graph repo)
       (<rtc-start! repo)))
    (state/<invoke-db-worker :thread-api/rtc-async-upload-graph
                             repo token remote-graph-name)))

(defn <get-remote-graphs []
  (if (db-sync-enabled?)
    (db-sync-handler/<get-remote-graphs)
    (rtc-handler/<get-remote-graphs)))

(defn <rtc-invite-email [graph-uuid email]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-invite-email graph-uuid email)
    (rtc-handler/<rtc-invite-email graph-uuid email)))

(defn <rtc-remove-member!
  [graph-uuid member-id]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-remove-member! graph-uuid member-id)
    (p/rejected (ex-info "RTC remove member not supported"
                         {:type :rtc/unsupported-remove-member
                          :graph-uuid graph-uuid
                          :member-id member-id}))))

(defn <rtc-leave-graph!
  [graph-uuid]
  (if (db-sync-enabled?)
    (db-sync-handler/<rtc-leave-graph! graph-uuid)
    (p/rejected (ex-info "RTC leave graph not supported"
                         {:type :rtc/unsupported-leave-graph
                          :graph-uuid graph-uuid}))))
