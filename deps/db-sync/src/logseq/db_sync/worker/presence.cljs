(ns logseq.db-sync.worker.presence
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.db-sync.worker.ws :as ws]))

(defn claims->user
  [claims]
  (when claims
    (let [user-id (aget claims "sub")
          email (aget claims "email")
          username (or (aget claims "preferred_username")
                       (aget claims "cognito:username")
                       (aget claims "username"))
          name (aget claims "name")]
      (when (string? user-id)
        (cond-> {:user-id user-id}
          (string? email) (assoc :email email)
          (string? username) (assoc :username username)
          (string? name) (assoc :name name))))))

(defn attachment->user
  [attachment]
  (:presence/user (bean/->clj attachment)))

(defn attachment->sync-context
  [attachment]
  (:sync/context (bean/->clj attachment)))

(defn- serialize-attachment!
  [^js ws user sync-context]
  (.serializeAttachment ws (bean/->js (cond-> {:presence/user user}
                                        (seq sync-context)
                                        (assoc :sync/context sync-context)))))

(defn presence*
  [^js self]
  (or (.-presence self)
      (set! (.-presence self) (atom {}))))

(defn online-users
  [^js self]
  (vec (distinct (vals @(presence* self)))))

(defn broadcast-online-users!
  [^js self]
  (ws/broadcast! self nil {:type "online-users" :online-users (online-users self)}))

(defn add-presence!
  ([^js self ^js ws user]
   (add-presence! self ws user nil))
  ([^js self ^js ws user sync-context]
   (swap! (presence* self) assoc ws user)
   (serialize-attachment! ws user sync-context)))

(defn update-presence!
  [^js self ^js ws {:keys [editing-block-uuid] :as updates}]
  (swap! (presence* self)
         (fn [presence]
           (if-let [user (get presence ws)]
             (let [user' (if (contains? updates :editing-block-uuid)
                           (if (and (string? editing-block-uuid)
                                    (not (string/blank? editing-block-uuid)))
                             (assoc user :editing-block-uuid editing-block-uuid)
                             (dissoc user :editing-block-uuid))
                           user)
                   sync-context (some-> ws
                                        .deserializeAttachment
                                        attachment->sync-context)]
               (serialize-attachment! ws user' sync-context)
               (assoc presence ws user'))
             presence))))

(defn get-user
  [^js self ^js ws]
  (get @(presence* self) ws))

(defn remove-presence!
  [^js self ^js ws]
  (swap! (presence* self) dissoc ws))
