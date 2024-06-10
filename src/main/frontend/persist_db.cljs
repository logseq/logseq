(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

(defonce opfs-db (browser/->InBrowser))

 (defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  opfs-db)

 (defn <list-db []
   (protocol/<list-db (get-impl)))

 (defn <unsafe-delete [repo]
   (protocol/<unsafe-delete (get-impl) repo))

(defn <export-db
  [repo opts]
  (protocol/<export-db (get-impl) repo opts))

(defn <import-db
  [repo data]
  (protocol/<import-db (get-impl) repo data))

(defn <fetch-init-data
  ([repo]
   (<fetch-init-data repo {}))
  ([repo opts]
   (p/do!
    (ipc/ipc :db-open repo)
    (protocol/<fetch-initial-data (get-impl) repo opts))))

(defn <new [repo]
  {:pre [(<= (count repo) 128)]}
  (p/let [_ (protocol/<new (get-impl) repo)
          _ (<export-db repo {})]
    (ipc/ipc :db-open repo)))
