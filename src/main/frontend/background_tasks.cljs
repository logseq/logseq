(ns frontend.background-tasks
  "Some background tasks"
  (:require [frontend.common.missionary :as c.m]
            [frontend.flows :as flows]
            [frontend.state :as state]
            [logseq.db.common.entity-plus :as entity-plus]
            [missionary.core :as m]))

(def ^:private search-input-idle-sync-interval-ms 500)
(def ^:private search-input-idle-diff-ms 1000)

(defn- search-input-idle-tick-flow
  []
  (m/observe
   (fn [emit!]
     (let [interval-id (js/setInterval #(emit! (js/Date.now)) search-input-idle-sync-interval-ms)]
       (emit! (js/Date.now))
       (fn []
         (js/clearInterval interval-id))))))

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

(c.m/run-background-task
 ::sync-to-worker-search-input-idle-status
 (m/reduce
  (fn [_ [_tick db-worker-ready? repo]]
    (when (and db-worker-ready? (seq repo))
      (state/<invoke-db-worker
       :thread-api/update-thread-atom
       :thread-atom/search-input-idle-status
       {repo {:idle? (state/input-idle? repo :diff search-input-idle-diff-ms)
              :ts (js/Date.now)}})))
  (m/latest vector
            (search-input-idle-tick-flow)
            state/db-worker-ready-flow
            flows/current-repo-flow)))
