(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [cljs-time.core :as t]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.common.missionary :as c.m]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [missionary.core :as m]
            [promesa.core :as p]))

(defn <rtc-create-graph!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (p/do!
     (js/Promise. user-handler/task--ensure-id&access-token)
     (let [token (state/get-auth-id-token)
           repo-name (sqlite-common-db/sanitize-db-name repo)]
       (.rtc-async-upload-graph worker repo token repo-name)))))

(defn <rtc-delete-graph!
  [graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (p/do!
     (js/Promise. user-handler/task--ensure-id&access-token)
     (let [token (state/get-auth-id-token)]
       (.rtc-delete-graph worker token graph-uuid)))))

(defn <rtc-download-graph!
  [graph-name graph-uuid timeout-ms]
  (when-let [^js worker @state/*db-worker]
    (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
    (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
            token (state/get-auth-id-token)
            download-info-uuid* (.rtc-request-download-graph worker token graph-uuid)
            download-info-uuid (ldb/read-transit-str download-info-uuid*)
            result (.rtc-wait-download-graph-info-ready worker token download-info-uuid graph-uuid timeout-ms)
            {:keys [_download-info-uuid
                    download-info-s3-url
                    _download-info-tx-instant
                    _download-info-t
                    _download-info-created-at]
             :as result} (ldb/read-transit-str result)]
      (->
       (when (not= result :timeout)
         (assert (some? download-info-s3-url) result)
         (.rtc-download-graph-from-s3 worker graph-uuid graph-name download-info-s3-url))
       (p/finally
         #(state/set-state! :rtc/downloading-graph-uuid nil))))))

(defn <rtc-stop!
  []
  (when-let [^js worker @state/*db-worker]
    (.rtc-stop worker)))

(defn <rtc-start!
  [repo & {:keys [stop-before-start?] :or {stop-before-start? true}}]
  (when-let [^js worker @state/*db-worker]
    (when (ldb/get-graph-rtc-uuid (db/get-db repo))
      (p/do!
       (js/Promise. user-handler/task--ensure-id&access-token)
       (when stop-before-start? (<rtc-stop!))
       (let [token (state/get-auth-id-token)]
         (p/let [result (.rtc-start worker repo token)
                 start-ex (ldb/read-transit-str result)
                 _ (case (:type (:ex-data start-ex))
                     (:rtc.exception/not-rtc-graph
                      :rtc.exception/not-found-db-conn)
                     (notification/show! (:ex-message start-ex) :error)

                     :rtc.exception/lock-failed
                     (js/setTimeout #(<rtc-start! repo) 1000)

                      ;; else
                     nil)]
           nil))))))

(defn <get-remote-graphs
  []
  (when-let [^js worker @state/*db-worker]
    (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
            token (state/get-auth-id-token)
            result (.rtc-get-graphs worker token)
            graphs (ldb/read-transit-str result)
            result (->> graphs
                        (remove (fn [graph] (= (:graph-status graph) "deleting")))
                        (mapv (fn [graph]
                                (merge
                                 (let [url (str config/db-version-prefix (:graph-name graph))]
                                   {:url url
                                    :GraphName (:graph-name graph)
                                    :GraphUUID (:graph-uuid graph)
                                    :rtc-graph? true})
                                 (dissoc graph :graph-uuid :graph-name)))))]
      (state/set-state! :rtc/graphs result))))

(defn <rtc-get-users-info
  []
  (when-let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
    (when-let [^js worker @state/*db-worker]
      (p/let [token (state/get-auth-id-token)
              repo (state/get-current-repo)
              result (.rtc-get-users-info worker token graph-uuid)
              result (ldb/read-transit-str result)]
        (state/set-state! :rtc/users-info {repo result})))))

(defn <rtc-invite-email
  [graph-uuid email]
  (when-let [^js worker @state/*db-worker]
    (let [token (state/get-auth-id-token)]
      (->
       (p/do!
        (.rtc-grant-graph-access worker token graph-uuid
                                 (ldb/write-transit-str [])
                                 (ldb/write-transit-str [email]))
        (notification/show! (str "Invitation sent!") :success))
       (p/catch (fn [e]
                  (notification/show! (str "Something wrong, please try again.") :error)
                  (js/console.error e)))))))

;;; background task: try to restart rtc-loop when possible,
;;; triggered by `rtc-flows/rtc-try-restart-flow`
(when-not config/publishing?
 (c.m/run-background-task
  ::restart-rtc-task
  (m/reduce
   (constantly nil)
   (m/ap
    (let [{:keys [graph-uuid t]} (m/?> rtc-flows/rtc-try-restart-flow)]
      (when (and graph-uuid t
                 (= graph-uuid (ldb/get-graph-rtc-uuid (db/get-db)))
                 (> 5000 (- (common-util/time-ms) t)))
        (prn :trying-to-restart-rtc graph-uuid (t/now))
        (c.m/<? (<rtc-start! (state/get-current-repo) :stop-before-start? false))))))))
