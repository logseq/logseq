(ns frontend.worker.debug
  "For debug usage"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]))

(defn get-sqlite-conn
  "Get current sqlite conn"
  []
  (worker-state/get-sqlite-conn (worker-state/get-current-repo)))

(defn get-conn
  "Get current db conn"
  []
  (worker-state/get-datascript-conn (worker-state/get-current-repo)))

(defn get-db
  "Get current db"
  []
  (some-> (get-conn) deref))

#_:clj-kondo/ignore
(defn pull
  [eid]
  (some-> (get-db) (d/pull '[*] eid)))

#_:clj-kondo/ignore
(defn entity
  [eid]
  (some-> (get-db) (d/entity eid)))
