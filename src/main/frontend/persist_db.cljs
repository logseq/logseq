(ns frontend.persist-db
   "Backend of DB based graph"
   (:require [frontend.persist-db.browser :as browser]
             [frontend.persist-db.protocol :as protocol]
             [promesa.core :as p]
             [frontend.state :as state]))

(defonce opfs-db (browser/->InBrowser))

 (defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  opfs-db)

 (defn <list-db []
   (protocol/<list-db (get-impl)))

 (defn <unsafe-delete [repo]
   (protocol/<unsafe-delete (get-impl) repo))

(defn <transact-data [repo tx-data tx-meta]
  (protocol/<transact-data (get-impl) repo tx-data tx-meta))

(defn <fetch-init-data
  ([repo]
   (<fetch-init-data repo {}))
  ([repo opts]
   (p/let [ret (protocol/<fetch-initial-data (get-impl) repo opts)]
     (js/console.log "fetch-initial-data" ret)
     ret)))

(defn <export-db
  [repo]
  (protocol/<export-db (get-impl) repo))

(defn <import-db
  [repo data]
  (protocol/<import-db (get-impl) repo data))

;; FIXME: limit repo name's length
;; @shuyu Do we still need this?
(defn <new [repo]
  {:pre [(<= (count repo) 56)]}
  (p/do!
    (let [current-repo (state/get-current-repo)]
     (when-not (= repo current-repo)
      ;; switch graph
       (<export-db current-repo))
     (protocol/<new (get-impl) repo))))
