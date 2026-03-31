(ns frontend.worker.debug
  "For debug usage"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]))

(defn get-conn
  "Get current db conn"
  []
  (worker-state/get-datascript-conn (worker-state/get-current-repo)))

(defn get-db
  "Get current db"
  []
  (some-> (get-conn) deref))

#_{:clojure-lsp/ignore [:clojure-lsp/unused-public-var]}
(defn pull
  [eid]
  (some-> (get-db) (d/pull '[*] eid)))

#_{:clojure-lsp/ignore [:clojure-lsp/unused-public-var]}
(defn entity
  [eid]
  (some-> (get-db) (d/entity eid)))
