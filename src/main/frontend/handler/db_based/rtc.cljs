(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [promesa.core :as p]))


(defn <rtc-create-graph!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)
           repo-name (sqlite-common-db/sanitize-db-name repo)]
       (.rtc-async-upload-graph2 worker repo token repo-name)))))

(defn <rtc-delete-graph!
  [graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-delete-graph2 worker token graph-uuid)))))

(defn <rtc-download-graph!
  [graph-name graph-uuid timeout-ms]
  (when-let [^js worker @state/*db-worker]
    (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
    (user-handler/<wrap-ensure-id&access-token
     (p/let [token (state/get-auth-id-token)
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
          #(state/set-state! :rtc/downloading-graph-uuid nil)))))))

(defn <rtc-stop!
  []
  (when-let [^js worker @state/*db-worker]
    (.rtc-stop2 worker)))

(defn <rtc-start!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (when (ldb/get-graph-rtc-uuid (db/get-db repo))
      (user-handler/<wrap-ensure-id&access-token
        ;; TODO: `<rtc-stop!` can return a chan so that we can remove timeout
       (<rtc-stop!)
       (let [token (state/get-auth-id-token)]
         (p/let [result (.rtc-start2 worker repo token)
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
  (let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (when worker
         (p/let [result (.rtc-get-graphs2 worker token)
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
           (state/set-state! :rtc/graphs result)))))))

(defn <rtc-get-users-info
  []
  (when-let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
    (when-let [^js worker @state/*db-worker]
      (p/let [token (state/get-auth-id-token)
              repo (state/get-current-repo)
              result (.rtc-get-users-info2 worker token graph-uuid)
              result (ldb/read-transit-str result)]
        (state/set-state! :rtc/users-info {repo result})))))

(defn <rtc-invite-email
  [graph-uuid email]
  (when-let [^js worker @state/*db-worker]
    (let [token (state/get-auth-id-token)]
      (->
       (p/do!
        (.rtc-grant-graph-access2 worker token graph-uuid
                                  (ldb/write-transit-str [])
                                  (ldb/write-transit-str [email]))
        (notification/show! (str "Invitation sent!") :success))
       (p/catch (fn [e]
                  (notification/show! (str "Something wrong, please try again.") :error)
                  (js/console.error e)))))))
