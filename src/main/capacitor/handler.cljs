(ns capacitor.handler
  (:require [logseq.db :as ldb]
            [frontend.db.conn :as db-conn]
            [frontend.state :as fstate]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.page :as page-handler]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn <load-view-data
  [view opts]
  (fstate/<invoke-db-worker :thread-api/get-view-data
    (fstate/get-current-repo) (:db/id view) opts))

(defn ui-db []
  (db-conn/get-db))

(defn get-all-pages []
  (some->> (ui-db) (ldb/get-all-pages) (sort-by :block/created-at) (reverse)))
