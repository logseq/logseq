(ns frontend.worker.rtc.debug-log
  "RTC debug logging stored in per-graph sqlite db."
  (:require [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]))

(defn create-tables!
  [^js db]
  (when db
    (.exec db "CREATE TABLE IF NOT EXISTS tx_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, repo TEXT, tx_data TEXT, tx_meta TEXT)")
    (.exec db "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, repo TEXT, direction TEXT NOT NULL, message TEXT NOT NULL)")))

(defn reset-tables!
  [^js db]
  (when db
    (.exec db "DROP TABLE IF EXISTS tx_log")
    (.exec db "DROP TABLE IF EXISTS messages"))
  (create-tables! db))

(defn gc!
  [^js db]
  (when db
    (doseq [table ["tx_log" "messages"]]
      (try
        (.exec db (str "DELETE FROM " table " WHERE id <= (SELECT id FROM " table " ORDER BY id DESC LIMIT 1 OFFSET 10000)"))
        (catch :default e
          (log/error :rtc-debug-log-gc-failed {:table table :error e}))))
    (.exec db "VACUUM")))

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
  (when (and (enabled?) repo)
    (when-let [db (worker-state/get-sqlite-conn repo :debug-log)]
      (insert! db
               "INSERT INTO tx_log (repo, tx_data, tx_meta) VALUES (?1, ?2, ?3)"
               [repo (safe-str tx-data) (safe-str tx-meta)])
      (log/debug :log-tx tx-meta))))

(defn log-ws-message!
  ([direction message]
   (log-ws-message! (worker-state/get-current-repo) direction message))
  ([repo direction message]
   (when (and (enabled?) repo message)
     (when-let [db (worker-state/get-sqlite-conn repo :debug-log)]
       (insert! db
                "INSERT INTO messages (repo, direction, message) VALUES (?1, ?2, ?3)"
                [repo (name direction) (str message)])))))
