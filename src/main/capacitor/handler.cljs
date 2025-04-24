(ns capacitor.handler
  (:require [frontend.db.react :as react]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [frontend.db.conn :as db-conn]
            [frontend.state :as fstate]
            [frontend.date :as date]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.db.utils :as db-util]
            [frontend.handler.notification :as notification]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn <load-view-data
  [view opts]
  (fstate/<invoke-db-worker :thread-api/get-view-data
    (fstate/get-current-repo) (:db/id view) opts))

(defn local-db []
  (db-conn/get-db))

(defn local-all-pages []
  (some->> (local-db) (ldb/get-all-pages) (sort-by :block/created-at) (reverse)))

(defn local-page [name]
  (ldb/get-page (local-db) name))

(defn sub-journals
  []
  (-> (react/q (fstate/get-current-repo)
        [:frontend.worker.react/journals]
        {:query-fn
         (fn []
           (p/let [{:keys [data]} (<load-view-data nil {:journals? true})]
             (remove nil? data)))}
        nil)
    util/react))

(defn <create-page!
  [page-name]
  (page-handler/<create! page-name {:redirect? false}))
