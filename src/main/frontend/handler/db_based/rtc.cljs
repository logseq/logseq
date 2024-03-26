(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [frontend.handler.notification :as notification]))


(defn <rtc-create-graph!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)
           repo-name (sqlite-common-db/sanitize-db-name repo)]
       (.rtc-async-upload-graph worker repo token repo-name)))))

(defn <rtc-delete-graph!
  [graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-delete-graph worker token graph-uuid)))))

(defn <rtc-download-graph!
  [repo graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (->
        (.rtc-download-graph worker repo token graph-uuid)
        (p/finally
          (fn []
            (state/set-state! :rtc/downloading-graph-uuid nil))))))))

(defn <rtc-stop!
  []
  (when-let [^js worker @state/*db-worker]
    (.rtc-stop worker)))

(defn <rtc-start!
  [repo & {:keys [retry] :or {retry 0}}]
  (when-let [^js worker @state/*db-worker]
    (when (ldb/get-graph-rtc-uuid (db/get-db repo))
      (user-handler/<wrap-ensure-id&access-token
        ;; TODO: `<rtc-stop!` can return a chan so that we can remove timeout
       (<rtc-stop!)
       (let [token (state/get-auth-id-token)]
         (p/let [result (.rtc-start worker repo token (state/sub [:ui/developer-mode?]))
                 _ (case result
                     "rtc-not-closed-yet"
                     (js/setTimeout #(<rtc-start! repo) 200)
                     ":graph-not-ready"
                     (when (< retry 3)
                       (let [delay (* 2000 (inc retry))]
                         (prn "graph still creating, retry rtc-start in " delay "ms")
                         (p/do! (p/delay delay)
                                (<rtc-start! repo :retry (inc retry)))))

                     (":break-rtc-loop" ":stop-rtc-loop")
                     nil
                     ;; else
                     nil)]
           nil))))))

(defn <get-remote-graphs
  []
  (let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [repo (state/get-current-repo)
           token (state/get-auth-id-token)]
       (when worker
         (p/let [result (.rtc-get-graphs worker repo token)
                 graphs (bean/->clj result)
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
  (when (ldb/get-graph-rtc-uuid (db/get-db))
    (when-let [^js worker @state/*db-worker]
      (p/let [repo (state/get-current-repo)
              result (.rtc-get-users-info worker)
              result (bean/->clj result)]
        (state/set-state! :rtc/users-info {repo result})))))

(defn <rtc-invite-email
  [graph-uuid email]
  (when-let [^js worker @state/*db-worker]
    (->
     (p/do!
      (.rtc-grant-graph-access worker graph-uuid
                               (ldb/write-transit-str [])
                               (ldb/write-transit-str [email]))
      (notification/show! (str "Invitation sent!") :success))
     (p/catch (fn [e]
                (notification/show! (str "Something wrong, please try again.") :error)
                (js/console.error e))))))
