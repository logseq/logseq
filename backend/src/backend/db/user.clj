(ns backend.db.user
  (:refer-clojure :exclude [get update])
  (:require [toucan.db :as db]
            [toucan.models :as model]
            [ring.util.response :as resp]
            [backend.config :as config]
            [backend.cookie :as cookie]
            [backend.jwt :as jwt]
            [backend.db.refresh-token :as refresh-token]))

(model/defmodel User :users)

;; move to handler
(defn logout
  []
  (-> (resp/redirect config/website-uri)
      (assoc :cookies cookie/delete-token)))

(defn get
  [id]
  (db/select-one User :id id))

(defn insert
  [{:keys [name email] :as args}]
  (when-not (db/exists? User {:email email})
    (db/insert! User args)))

(defn delete
  [id]
  (db/delete! User {:id id}))

(defn update-email
  [id email]
  (cond
    (db/exists? User {:email email})
    [:bad :email-address-exists]

    :else
    [:ok (db/update! User id {:email email})]))

(defn generate-tokens
  [user-id]
  (cookie/token-cookie
   {:access-token  (jwt/sign {:id user-id})
    :refresh-token (refresh-token/create user-id)}))
