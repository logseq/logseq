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

(def ^:private transitions
  {"created" #{"running" "paused" "failed" "canceled" "completed"}
   "running" #{"running" "paused" "failed" "canceled" "completed"}
   "paused" #{"running" "paused" "failed" "canceled" "completed"}
   "completed" #{}
   "failed" #{}
   "canceled" #{}})

(defn transition-allowed?
  [from to]
  (contains? (get transitions from #{}) to))

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

(defn enqueue-order [session order]
  (update session :pending-orders (fnil conj []) order))

(defn drain-orders [session]
  (let [orders (vec (:pending-orders session))]
    [orders (assoc session :pending-orders [])]))

(defn filter-events
  [events {:keys [since-ts limit]}]
  (let [events (if (number? since-ts)
                 (filter #(> (:ts %) since-ts) events)
                 events)
        events (vec events)]
    (cond
      (and (number? limit) (pos? limit))
      (subvec events 0 (min (count events) limit))

      (and (number? limit) (<= limit 0))
      []

      :else
      events)))
