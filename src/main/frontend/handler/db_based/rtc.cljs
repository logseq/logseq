(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [clojure.pprint :as pp]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn <rtc-create-graph!
  [repo]
  (p/do!
   (js/Promise. user-handler/task--ensure-id&access-token)
   (let [token (state/get-auth-id-token)
         repo-name (common-sqlite/sanitize-db-name repo)]
     (state/<invoke-db-worker :thread-api/rtc-async-upload-graph repo token repo-name))))

(defn <rtc-delete-graph!
  [graph-uuid schema-version]
  (p/do!
   (js/Promise. user-handler/task--ensure-id&access-token)
   (let [token (state/get-auth-id-token)]
     (state/<invoke-db-worker :thread-api/rtc-delete-graph token graph-uuid schema-version))))

(defn <rtc-download-graph!
  [graph-name graph-uuid graph-schema-version timeout-ms]
  (assert (some? graph-schema-version))
  (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
  (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
          token (state/get-auth-id-token)
          download-info-uuid (state/<invoke-db-worker
                              :thread-api/rtc-request-download-graph token graph-uuid graph-schema-version)
          {:keys [_download-info-uuid
                  download-info-s3-url
                  _download-info-tx-instant
                  _download-info-t
                  _download-info-created-at]
           :as result}
          (state/<invoke-db-worker :thread-api/rtc-wait-download-graph-info-ready
                                   token download-info-uuid graph-uuid graph-schema-version timeout-ms)]
    (->
     (when (not= result :timeout)
       (assert (some? download-info-s3-url) result)
       (state/<invoke-db-worker :thread-api/rtc-download-graph-from-s3 graph-uuid graph-name download-info-s3-url))
     (p/finally
       #(state/set-state! :rtc/downloading-graph-uuid nil)))))

(defn <rtc-stop!
  []
  (state/<invoke-db-worker :thread-api/rtc-stop))

(defn <rtc-branch-graph!
  [repo]
  (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
          token (state/get-auth-id-token)
          start-ex (state/<invoke-db-worker :thread-api/rtc-async-branch-graph repo token)]
    (when-let [ex-data* (:ex-data start-ex)]
      (throw (ex-info (:ex-message start-ex) ex-data*)))))

(defn notification-download-higher-schema-graph!
  [graph-name graph-uuid schema-version]
  (let [graph-name* (str graph-name "-" schema-version)]
    (notification/show!
     [:div "There's a higher schema-version graph on the server."
      (shui/button
       {:on-click
        (fn [e]
          (util/stop e)
          (<rtc-download-graph! graph-name* graph-uuid schema-version 60000))}
       "Download")]
     :warning false)))

(declare <rtc-start!)
(defn- notification-upload-higher-schema-graph!
  [repo]
  (notification/show!
   [:div.flex.flex-col.gap-2
    [:div "The local graph has a higher schema version than the graph on the server."]
    [:div
     (shui/button
      {:size :sm
       :on-click
       (fn [e]
         (util/stop e)
         (p/do! (<rtc-branch-graph! repo)
                (rtc-flows/trigger-rtc-start repo)))}
      "Upload to server")]]
   :warning false))

(defn <rtc-start!
  [repo & {:keys [stop-before-start?] :or {stop-before-start? true}}]
  (when-let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db repo))]
    (p/do!
     (js/Promise. user-handler/task--ensure-id&access-token)
     (p/let [start-ex (state/<invoke-db-worker :thread-api/rtc-start stop-before-start?)
             ex-data* (:ex-data start-ex)
             _ (case (:type ex-data*)
                 (:rtc.exception/not-rtc-graph
                  :rtc.exception/not-found-db-conn)
                 (notification/show! (:ex-message start-ex) :error)

                 :rtc.exception/major-schema-version-mismatched
                 (case (:sub-type ex-data*)
                   :download
                   (notification-download-higher-schema-graph! repo graph-uuid (:remote ex-data*))
                   :create-branch
                   (notification-upload-higher-schema-graph! repo)
                   ;; else
                   (do (log/info :start-ex start-ex)
                       (notification/show! [:div
                                            [:div (:ex-message start-ex)]
                                            [:div (-> ex-data*
                                                      (select-keys [:app :local :remote])
                                                      pp/pprint
                                                      with-out-str)]]
                                           :error)))

                 :rtc.exception/lock-failed
                 (js/setTimeout #(<rtc-start! repo) 1000)

                 ;; else
                 nil)]
       nil))))

(defn <get-remote-graphs
  []
  (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
          token (state/get-auth-id-token)
          graphs (state/<invoke-db-worker :thread-api/rtc-get-graphs token)
          result (->> graphs
                      (remove (fn [graph] (= (:graph-status graph) "deleting")))
                      (mapv (fn [graph]
                              (merge
                               (let [url (str config/db-version-prefix (:graph-name graph))]
                                 {:url url
                                  :GraphName (:graph-name graph)
                                  :GraphSchemaVersion (:graph-schema-version graph)
                                  :GraphUUID (:graph-uuid graph)
                                  :rtc-graph? true})
                               (dissoc graph :graph-uuid :graph-name)))))]
    (state/set-state! :rtc/graphs result)
    (repo-handler/refresh-repos!)))

(defn <rtc-get-users-info
  []
  (when-let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
    (p/let [token (state/get-auth-id-token)
            repo (state/get-current-repo)
            result (state/<invoke-db-worker :thread-api/rtc-get-users-info token graph-uuid)]
      (state/set-state! :rtc/users-info {repo result}))))

(defn <rtc-invite-email
  [graph-uuid email]
  (let [token (state/get-auth-id-token)]
    (->
     (p/do!
      (state/<invoke-db-worker :thread-api/rtc-grant-graph-access
                               token (str graph-uuid) [] [email])
      (notification/show! "Invitation sent!" :success))
     (p/catch (fn [e]
                (notification/show! "Something wrong, please try again." :error)
                (js/console.error e))))))
