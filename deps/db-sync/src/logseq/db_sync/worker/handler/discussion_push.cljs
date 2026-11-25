(ns logseq.db-sync.worker.handler.discussion-push
  (:require [datascript.core :as d]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def device-path "/mobile/push-device")

(defn- uuid-string? [value]
  (and (string? value)
       (some? (re-matches #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" value))))

(defn- valid-token? [platform token]
  (and (string? token)
       (case platform
         ("apns" "apns-sandbox") (some? (re-matches #"[0-9a-f]{32,256}" token))
         "fcm" (some? (re-matches #"[a-zA-Z0-9:_-]{20,4096}" token))
         false)))

(defn- statement [^js db query & arguments]
  (let [^js prepared (.prepare db query)]
    (.apply (.-bind prepared) prepared (to-array arguments))))

(defn- send-enabled? [env]
  (= "true" (aget env "DISCUSSION_PUSH_ENABLED")))

(defn <register [request env]
  (p/let [claims (auth/auth-claims request env)
          account (some-> claims (aget "sub"))
          ^js db (aget env "DB")
          method (.-method request)]
    (cond
      (not (uuid-string? account)) (http/unauthorized)
      (not (contains? #{"PUT" "DELETE"} method)) (http/not-found)
      (and (= method "PUT") (not (send-enabled? env)))
      (http/error-response "Push notifications are unavailable" 503)
      :else
      (p/let [body (common/read-json request)
              installation (some-> body (aget "installationId"))
              platform (some-> body (aget "platform"))
              token (some-> body (aget "token"))]
        (cond
          (not (uuid-string? installation)) (http/bad-request "Invalid installation")
          (= method "DELETE")
          (p/let [_ (.run (statement db
                                     "DELETE FROM discussion_push_devices WHERE installation_id = ? AND user_id = ?"
                                     installation account))]
            (js/Response. nil #js {:status 204}))
          (not (valid-token? platform token)) (http/bad-request "Invalid platform or token")
          :else
          (p/let [_ (.batch db
                            #js [(statement db
                                            "DELETE FROM discussion_push_devices WHERE platform = ? AND token = ?"
                                            platform token)
                                 (statement db
                                            (str "INSERT INTO discussion_push_devices VALUES (?, ?, ?, ?, ?) "
                                                 "ON CONFLICT(installation_id) DO UPDATE SET user_id = excluded.user_id, "
                                                 "platform = excluded.platform, token = excluded.token, updated_at = excluded.updated_at")
                                            installation account platform token (common/now-ms))])]
            (js/Response. nil #js {:status 204})))))))

(defn- class? [entity ident]
  (some #(= ident (:db/ident %)) (:block/tags entity)))

(defn- live? [entity]
  (and (:block/uuid entity) (nil? (:logseq.property/deleted-at entity))))

(defn- author [entity]
  (some-> entity :logseq.property/created-by-ref :block/uuid str))

(defn- event-recipients [entity]
  (if-let [target (:logseq.property.reaction/target entity)]
    (when (live? target) [(author target)])
    (let [thread (:block/parent entity)]
      (when (and (live? thread) (class? thread :logseq.class/Comments))
        (let [targets (or (seq (:logseq.property.comments/blocks thread)) [(:block/parent thread)])]
          (map author (filter live? (concat targets (:block/_parent thread)))))))))

(defn event-routes [db-before db-after tx-data sender]
  (when (uuid-string? sender)
    (->> tx-data
         (keep (fn [{:keys [added a e]}]
                 (when (and added (= :block/uuid a)) e)))
         distinct
         (take 32)
         (keep (fn [eid]
                 (let [event (d/entity db-after eid)]
                   (when (and (not (:block/uuid (d/entity db-before eid)))
                              (live? event) (= sender (author event)))
                     (let [members (->> (event-recipients event)
                                        (filter uuid-string?)
                                        (remove #{sender})
                                        distinct
                                        (take 12)
                                        vec)]
                       (when (seq members)
                         {:event (str (:block/uuid event)) :recipients members}))))))
         vec)))

(defn <queue-events! [env graph-id sender events]
  (let [now (common/now-ms)
        ^js db (aget env "DB")
        insert (str "INSERT OR IGNORE INTO discussion_push_outbox "
                    "(graph_id, event_id, recipient_id, sender_id, created_at, next_attempt_at) "
                    "SELECT ?, ?, ?, ?, ?, ? WHERE "
                    "EXISTS (SELECT 1 FROM graphs WHERE graph_id = ? AND user_id = ? "
                    "UNION SELECT 1 FROM graph_members WHERE graph_id = ? AND user_id = ?) "
                    "AND EXISTS (SELECT 1 FROM graphs WHERE graph_id = ? AND user_id = ? "
                    "UNION SELECT 1 FROM graph_members WHERE graph_id = ? AND user_id = ?) "
                    "AND EXISTS (SELECT 1 FROM discussion_push_devices WHERE user_id = ?) "
                    "AND (SELECT count(*) FROM discussion_push_outbox WHERE sender_id = ? AND created_at > ?) < 60")
        writes (for [{:keys [event recipients]} events
                     recipient recipients]
                 (statement db insert graph-id event recipient sender now now
                            graph-id sender graph-id sender graph-id recipient graph-id recipient
                            recipient sender (- now 60000)))]
    (when (and db (send-enabled? env) (uuid-string? graph-id) (seq events))
      (.batch db (to-array (take 60 writes))))))

(defn enabled? [env]
  (and (aget env "DB") (send-enabled? env)))
