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

(defn- serialize-attachment!
  [^js self ^js ws user]
  (let [graph-id (aget self "graph-id")
        attachment (cond-> {}
                     user (assoc :presence/user user)
                     (string? graph-id) (assoc :presence/graph-id graph-id))]
    (.serializeAttachment ws (bean/->js attachment))))

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
  [^js self ^js ws user]
  (when user
    (swap! (presence* self) assoc ws user))
  (serialize-attachment! self ws user))

(defn restore-attachment!
  [^js self ws attachment]
  (let [{graph-id :presence/graph-id user :presence/user} (bean/->clj attachment)]
    (when (string? graph-id)
      (aset self "graph-id" graph-id))
    (when user
      (swap! (presence* self) assoc ws user))))

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
                           user)]
               (serialize-attachment! self ws user')
               (assoc presence ws user'))
             presence))))

(defn get-user
  [^js self ^js ws]
  (get @(presence* self) ws))

(defn remove-presence!
  [^js self ^js ws]
  (swap! (presence* self) dissoc ws))
