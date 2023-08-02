(ns logseq.db.sqlite.rtc
  "Entry point for using sqlite to store operations for rtc-sync"
  (:require [logseq.db.sqlite.db :as sqlite-db]))

(defn- ds-op->sqlite-op
  [op]
  {:v (js/JSON.stringify (clj->js op))})

(defn create-op-table!
  [db db-name]
  (let [stmt (sqlite-db/prepare db "CREATE TABLE IF NOT EXISTS rtc_ops (
                         id   INTEGER PRIMARY KEY AUTOINCREMENT,
                         v    TEXT NOT NULL)"
                                (str db-name))]
    (.run ^object stmt)
    (let [init-stmt (sqlite-db/prepare db "INSERT INTO rtc_ops (v) VALUES (@v)" (str db-name))]
      (.run ^object init-stmt (clj->js (ds-op->sqlite-op {:local-tx 0}))))))

(defn init!
  [graphs-dir repo]
  (let [[_db-sanitized-name db-full-path] (sqlite-db/get-db-full-path graphs-dir repo)
        db (new sqlite-db/sqlite db-full-path nil)]
    (create-op-table! db repo)))


(defn add-ops!
  [repo ops]
  (when (seq ops)
    (when-let [db (sqlite-db/get-db repo)]
      (let [insert      (sqlite-db/prepare db "INSERT INTO rtc_ops (v) VALUES (@v)" repo)
            insert-many (.transaction ^object db
                                      (fn [ops]
                                        (doseq [op ops]
                                          (.run ^object insert (clj->js (ds-op->sqlite-op op))))))]
        (insert-many ops)))))

(defn get-ops&local-tx
  [repo]
  (when-let [db (sqlite-db/get-db repo)]
    (sqlite-db/query repo db "select * from rtc_ops")))

(defn clean-ops!
  [repo]
  (when-let [db (sqlite-db/get-db repo)]
    (.run (sqlite-db/prepare db "DELETE FROM rtc_ops WHERE id <> 1" repo))))
