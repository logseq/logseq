(ns frontend.background-tasks
  "Some background tasks"
  (:require [frontend.common.missionary :as c.m]
            [frontend.flows :as flows]
            [frontend.state :as state]
            [logseq.db.common.entity-plus :as entity-plus]
            [missionary.core :as m]))

(c.m/run-background-task
 :logseq.db.common.entity-plus/reset-immutable-entities-cache!
 (m/reduce
  (fn [_ repo]
    (when (some? repo)
      ;; (prn :reset-immutable-entities-cache!)
      (entity-plus/reset-immutable-entities-cache!)))
  flows/current-repo-flow))

(c.m/run-background-task
 ::sync-to-worker-network-online-status
 (m/reduce
  (fn [_ [online? db-worker-ready?]]
    (when db-worker-ready?
      (state/<invoke-db-worker :thread-api/update-thread-atom :thread-atom/online-event online?)))
  (m/latest vector flows/network-online-event-flow state/db-worker-ready-flow)))
