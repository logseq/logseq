(ns backend.db.refresh-token
  (:refer-clojure :exclude [get update])
  (:require [toucan.db :as db]
            [toucan.models :as model]
            [backend.util :as util]))

(model/defmodel RefreshToken :refresh_tokens
  model/IModel
  (primary-key [_] :user_id))

(defn get-token
  [user-id]
  (db/select-one-field :token RefreshToken {:user_id user-id}))

(defn token-exists?
  [token]
  (db/exists? RefreshToken {:token token}))

(defn get-user-id-by-token
  [token]
  (db/select-one-field :user_id RefreshToken {:token token}))

(defn create
  [user-id]
  (if-let [token (get-token user-id)]
    token
    (loop [token (util/uuid)]
      (if (token-exists? token)
        (recur (util/uuid))
        (do
          (db/insert! RefreshToken {:user_id user-id
                                    :token token})
          token)))))
