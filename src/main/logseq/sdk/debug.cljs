(ns ^:no-doc logseq.sdk.debug
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]))

(defn ^:export log_app_state
  [path]
  (-> (if (string? path)
        (get @state/state (keyword path))
        @state/state)
      (bean/->js)))

(defn- current-repo-or-throw
  []
  (if-let [repo (state/get-current-repo)]
    repo
    (throw (ex-info "No current repo" {:type :debug/no-current-repo}))))

(defn ^:export syncStopUpload
  []
  (state/<invoke-db-worker :thread-api/db-sync-stop-upload (current-repo-or-throw)))

(defn ^:export syncResumeUpload
  []
  (state/<invoke-db-worker :thread-api/db-sync-resume-upload (current-repo-or-throw)))

(defn ^:export syncUploadStopped
  []
  (state/<invoke-db-worker :thread-api/db-sync-upload-stopped? (current-repo-or-throw)))

;; Snake_case aliases for consistency with existing debug exports.
(defn ^:export sync_stop_upload [] (syncStopUpload))
(defn ^:export sync_resume_upload [] (syncResumeUpload))
(defn ^:export sync_upload_stopped [] (syncUploadStopped))
