(ns frontend.worker.sync.presence
  "Presence and rtc state helpers for db sync."
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]))

(defn current-client
  [db-sync-client repo]
  (let [client @db-sync-client]
    (when (= repo (:repo client))
      client)))

(defn client-ops-conn
  [get-client-ops-conn repo]
  (get-client-ops-conn repo))

(defn sync-counts
  [{:keys [get-datascript-conn
           get-client-ops-conn
           get-unpushed-asset-ops-count
           get-local-tx
           get-graph-uuid
           latest-remote-tx]}
   repo]
  (when (get-datascript-conn repo)
    (let [pending-local (when-let [conn (client-ops-conn get-client-ops-conn repo)]
                          (count (d/datoms @conn :avet :db-sync/created-at)))
          pending-asset (get-unpushed-asset-ops-count repo)
          local-tx (get-local-tx repo)
          remote-tx (get latest-remote-tx repo)
          pending-server (when (and (number? local-tx) (number? remote-tx))
                           (max 0 (- remote-tx local-tx)))
          graph-uuid (get-graph-uuid repo)]
      {:pending-local pending-local
       :pending-asset pending-asset
       :pending-server pending-server
       :local-tx local-tx
       :remote-tx remote-tx
       :graph-uuid graph-uuid})))

(defn normalize-online-users
  [users]
  (->> users
       (keep (fn [{:keys [user-id email username name]}]
               (when (string? user-id)
                 (let [display-name (or username name user-id)]
                   (cond-> {:user/uuid user-id
                            :user/name display-name}
                     (string? email) (assoc :user/email email))))))
       (common-util/distinct-by :user/uuid)
       (vec)))

(defn rtc-state-payload
  [sync-counts-f client]
  (let [repo (:repo client)
        ws-state @(:ws-state client)
        online-users @(:online-users client)
        {:keys [pending-local pending-asset pending-server local-tx remote-tx graph-uuid]}
        (sync-counts-f repo)]
    {:rtc-state {:ws-state ws-state}
     :rtc-lock (= :open ws-state)
     :online-users (or online-users [])
     :unpushed-block-update-count (or pending-local 0)
     :pending-asset-ops-count (or pending-asset 0)
     :pending-server-ops-count (or pending-server 0)
     :local-tx local-tx
     :remote-tx remote-tx
     :graph-uuid graph-uuid}))

(defn set-ws-state!
  [broadcast-f client ws-state]
  (when-let [*ws-state (:ws-state client)]
    (reset! *ws-state ws-state)
    (broadcast-f client)))

(defn update-online-users!
  [broadcast-f client users]
  (when-let [*online-users (:online-users client)]
    (let [users' (normalize-online-users users)]
      (when (not= users' @*online-users)
        (reset! *online-users users')
        (broadcast-f client)))))

(defn update-user-presence!
  [broadcast-f client user-id* editing-block-uuid]
  (when (and user-id* editing-block-uuid)
    (when-let [*online-users (:online-users client)]
      (swap! *online-users
             (fn [users]
               (mapv (fn [user]
                       (if (= user-id* (:user/uuid user))
                         (assoc user :user/editing-block-uuid editing-block-uuid)
                         user))
                     users)))
      (broadcast-f client))))
