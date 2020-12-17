(ns frontend.db.base
  "Base query utils are required by model.cljs and react.cljs"
  (:require [frontend.state :as state]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.util :as util]))

(defn entity
  ([id-or-lookup-ref]
   (entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (when-let [db (conn/get-conn repo)]
     (d/entity db id-or-lookup-ref))))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [conn (conn/get-conn repo)]
     (try
       (d/pull conn
         selector
         eid)
       (catch js/Error e
         nil)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [conn (conn/get-conn repo)]
     (try
       (d/pull-many conn selector eids)
       (catch js/Error e
         (js/console.error e))))))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                     (remove nil?))]
       (when (seq tx-data)
         (when-let [conn (conn/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (conn/get-conn repo-url)]
     (some-> (d/entity db key)
       key))))
