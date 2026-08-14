(ns frontend.background-tasks
  "Some background tasks"
  (:require [frontend.flows :as flows]
            [frontend.state :as state]
            [logseq.db.common.entity-plus :as entity-plus]))

(def ^:private search-input-idle-sync-interval-ms 500)
(def ^:private search-input-idle-diff-ms 1000)

(defonce ^:private *background-cancelers
  (volatile! {}))

(defn- run-background!
  [key' start!]
  (when-let [cancel! (get @*background-cancelers key')]
    (cancel!))
  (vswap! *background-cancelers assoc key' (start!))
  nil)

(defn- watch-atoms!
  [key' atoms f]
  (let [watch-keys (mapv #(keyword (str (namespace key') "." (name key') "-" %))
                         (range (count atoms)))]
    (doseq [[watch-key atom'] (map vector watch-keys atoms)]
      (add-watch atom' watch-key (fn [_ _ _ _] (f))))
    (f)
    (fn []
      (doseq [[watch-key atom'] (map vector watch-keys atoms)]
        (remove-watch atom' watch-key)))))

(run-background!
 :logseq.db.common.entity-plus/reset-immutable-entities-cache!
 (fn []
   (watch-atoms!
    :logseq.db.common.entity-plus/reset-immutable-entities-cache!
    [flows/current-repo]
    (fn []
      (when (some? @flows/current-repo)
        ;; (prn :reset-immutable-entities-cache!)
        (entity-plus/reset-immutable-entities-cache!))))))

(run-background!
 ::sync-to-worker-network-online-status
 (fn []
   (watch-atoms!
    ::sync-to-worker-network-online-status
    [flows/network-online? state/db-worker-ready?]
    (fn []
      (when @state/db-worker-ready?
        (state/<invoke-db-worker
         :thread-api/update-thread-atom
         :thread-atom/online-event
         @flows/network-online?))))))

(run-background!
 ::sync-to-worker-search-input-idle-status
 (fn []
   (let [sync-state (atom {})
         sync! (fn []
                 (let [db-worker-ready? @state/db-worker-ready?
                       repo @flows/current-repo
                       {:keys [last-synced-repo last-synced-idle? prev-db-worker-ready?]} @sync-state]
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
                       (reset! sync-state
                               {:last-synced-repo repo
                                :last-synced-idle? idle?
                                :prev-db-worker-ready? db-worker-ready?}))
                     (reset! sync-state
                             {:last-synced-repo nil
                              :last-synced-idle? nil
                              :prev-db-worker-ready? db-worker-ready?}))))
         cancel-watch! (watch-atoms!
                        ::sync-to-worker-search-input-idle-status
                        [state/db-worker-ready? flows/current-repo]
                        sync!)
         interval-id (js/setInterval sync! search-input-idle-sync-interval-ms)]
     (fn []
       (cancel-watch!)
       (js/clearInterval interval-id)))))
