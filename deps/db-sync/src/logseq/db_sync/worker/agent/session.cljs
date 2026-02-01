(ns logseq.db-sync.worker.agent.session
  (:require [logseq.db-sync.common :as common]))

(defn initial-session [task audit now]
  {:id (:id task)
   :status "created"
   :task task
   :audit audit
   :created-at now
   :updated-at now})

(defn- status-from-event [event-type]
  (case event-type
    "session.running" "running"
    "session.paused" "paused"
    "session.completed" "completed"
    "session.failed" "failed"
    "session.canceled" "canceled"
    nil))

(defn append-event [session events {:keys [type data event-id ts]}]
  (let [event-id (or event-id (str (random-uuid)))
        ts (or ts (common/now-ms))
        event {:event-id event-id
               :session-id (:id session)
               :type type
               :ts ts
               :data data}
        next-status (or (status-from-event type) (:status session))
        updated (assoc session :status next-status :updated-at ts)
        events (conj (vec events) event)]
    [updated events event]))
