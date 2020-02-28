(ns backend.db.repo
  (:refer-clojure :exclude [get update])
  (:require [toucan.db :as db]
            [toucan.models :as model]
            [ring.util.response :as resp]
            [backend.config :as config]
            [backend.cookie :as cookie]))

(model/defmodel Repo :repos)

(defn insert
  [args]
  (cond
    (and
     (:user_id args) (:url args)
     (db/exists? Repo (select-keys args [:user_id :url])))
    [:bad :user-repo-exists]

    :else
    [:ok (db/insert! Repo args)]))

(defn get-user-repos
  [user-id]
  (db/select Repo {:user_id user-id}))

(defn delete
  [id]
  (db/delete! Repo {:id id}))

(defn update
  [id url]
  (db/update! Repo id {:url url}))
