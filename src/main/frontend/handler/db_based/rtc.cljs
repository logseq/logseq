(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.db :as db]
            [logseq.db :as ldb]))

(defn <rtc-create-graph!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-upload-graph worker repo token "TODO:remote-graph-name")))))

(defn <rtc-delete-graph!
  [graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-delete-graph worker token graph-uuid)))))

(defn <rtc-download-graph!
  [repo graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-download-graph worker repo token graph-uuid)))))

(defn <rtc-start!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (when (ldb/get-graph-rtc-uuid (db/get-db repo))
      (user-handler/<wrap-ensure-id&access-token
       (let [token (state/get-auth-id-token)]
         (.rtc-start worker repo token
                     (and config/dev?
                          (state/sub [:ui/developer-mode?]))))))))

(defn <rtc-stop!
  []
  (when-let [^js worker @state/*db-worker]
    (.rtc-stop worker)))

;; TODO: shared graphs need `shared-by`, user name
(defn <get-remote-graphs
  []
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [repo (state/get-current-repo)
           token (state/get-auth-id-token)]
       (p/let [result (.rtc-get-graphs worker repo token)
               graphs (bean/->clj result)
               result (->> graphs
                           (remove (fn [graph]
                                     (= (:graph-status graph) "deleting")))
                           (mapv (fn [graph]
                                   (merge
                                    {:GraphName (or (:graph-name graph)
                                                   ;; FIXME: remove this later
                                                    (str (:graph-uuid graph)))
                                     :GraphUUID (:graph-uuid graph)
                                     :rtc-graph? true}
                                    (dissoc graph :graph-uuid :graph-name)))))]
         (state/set-state! :rtc/graphs result))))))
