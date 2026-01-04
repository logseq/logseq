(ns frontend.worker.rtc.debug-log
  "RTC debug logging stored in per-graph sqlite db."
  (:require [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]))

(defn create-tables!
  [^js db]
  (when db
    (.exec db "CREATE TABLE IF NOT EXISTS tx_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, tx_data TEXT, tx_meta TEXT)")
    (.exec db "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, direction TEXT NOT NULL, message TEXT NOT NULL)")))

(defn- enabled?
  []
  (worker-state/rtc-debug-enabled?))

(defn- safe-str
  [value]
  (try
    (pr-str value)
    (catch :default _
      (str value))))

(defn- insert!
  [^js db sql params]
  (try
    (.exec db #js {:sql sql
                   :bind (clj->js params)})
    (catch :default e
      (log/error :rtc-debug-log-insert-failed e))))

(defn log-tx!
  [repo tx-data tx-meta]
  (when repo
    (when-let [db (worker-state/get-sqlite-conn repo :debug-log)]
      (insert! db
               "INSERT INTO tx_log (created_at, tx_data, tx_meta) VALUES (?1, ?2, ?3)"
               [(common-util/time-ms) (safe-str tx-data) (safe-str tx-meta)])
      (prn :debug :log-tx tx-meta))))

(defn log-ws-message!
  ([direction message]
   (log-ws-message! (worker-state/get-current-repo) direction message))
  ([repo direction message]
   (when (and (enabled?) repo message)
     (when-let [db (worker-state/get-sqlite-conn repo :debug-log)]
       (insert! db
                "INSERT INTO messages (created_at, direction, message) VALUES (?1, ?2, ?3)"
                [(common-util/time-ms) (name direction) (str message)])))))
