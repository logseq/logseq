(ns frontend.db.conn
  "Contains db connections."
  (:require [clojure.string :as string]
            [frontend.db-schema :as db-schema]
            [frontend.db.default :as default-db]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.idb :as idb]
            [datascript.core :as d]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (if (util/starts-with? url "http")
    (->> (take-last 2 (string/split url #"/"))
         (string/join "/"))
    url))

(defn datascript-db
  [repo]
  (when repo
    (str config/idb-db-prefix (get-repo-path repo))))

(defn remove-db!
  [repo]
  (idb/remove-item! (datascript-db repo)))

(defn get-conn
  ([]
   (get-conn (state/get-current-repo) true))
  ([repo-or-deref?]
   (if (boolean? repo-or-deref?)
     (get-conn (state/get-current-repo) repo-or-deref?)
     (get-conn repo-or-deref? true)))
  ([repo deref?]
   (let [repo (if repo repo (state/get-current-repo))]
     (when-let [conn (get @conns (datascript-db repo))]
       (if deref?
         @conn
         conn)))))

(defn reset-conn! [conn db]
  (reset! conn db))

(defn remove-conn!
  [repo]
  (swap! conns dissoc (datascript-db repo)))

(defn me-tx
  [db {:keys [name email avatar]}]
  (util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))

(defn start!
  ([me repo]
   (start! me repo {}))
  ([me repo {:keys [db-type listen-handler]}]
   (let [db-name (datascript-db repo)
         db-conn (d/create-conn db-schema/schema)]
     (swap! conns assoc db-name db-conn)
     (d/transact! db-conn [(cond-> {:schema/version db-schema/version}
                             db-type
                             (assoc :db/type db-type))
                           {:block/name "card"
                            :block/original-name "card"
                            :block/uuid (d/squuid)}])
     (when me
       (d/transact! db-conn [(me-tx (d/db db-conn) me)]))

     (d/transact! db-conn default-db/built-in-pages)

     (when listen-handler
       (listen-handler repo)))))

(defn destroy-all!
  []
  (reset! conns {}))
