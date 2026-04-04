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
  (fn [{:keys [last-synced-repo last-synced-idle? prev-db-worker-ready?] :as sync-state}
       [_tick db-worker-ready? repo]]
    (if (and db-worker-ready? (seq repo))
      (let [idle? (state/input-idle? repo :diff search-input-idle-diff-ms)
            should-sync?
            (or (nil? last-synced-repo)
                (not= last-synced-repo repo)
                (and db-worker-ready? (not prev-db-worker-ready?))
                (not= last-synced-idle? idle?))]
        (when should-sync?
          (state/<invoke-db-worker
           :thread-api/update-thread-atom
           :thread-atom/search-input-idle-status
           {repo {:idle? idle?
                  :ts (js/Date.now)}}))
        (assoc sync-state
               :last-synced-repo repo
               :last-synced-idle? idle?
               :prev-db-worker-ready? db-worker-ready?))
      (assoc sync-state
             :last-synced-repo nil
             :last-synced-idle? nil
             :prev-db-worker-ready? db-worker-ready?)))
  (m/latest vector
            (search-input-idle-tick-flow)
            state/db-worker-ready-flow
            flows/current-repo-flow)))
