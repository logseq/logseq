(ns backend.db.token
  (:refer-clojure :exclude [get update])
  (:require [toucan.db :as db]
            [toucan.models :as model]
            [backend.util :as util]))

(model/defmodel Token :tokens)

(defn get
  [oauth-type oauth-id]
  (db/select-one Token {:oauth_type oauth-type
                        :oauth_id oauth-id}))

(defn exists?
  [oauth-type oauth-id]
  (db/exists? Token {:oauth_type oauth-type
                     :oauth_id oauth-id}))

(defn delete
  [oauth-type oauth-id]
  (db/delete! Token {:oauth_type oauth-type
                     :oauth_id oauth-id}))

(defn create
  [{:keys [oauth_type oauth_id] :as m}]
  (if (exists? oauth_type oauth_id)
    (delete oauth_type oauth_id))
  (db/insert! Token m))
