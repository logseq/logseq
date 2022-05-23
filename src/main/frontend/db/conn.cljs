(ns frontend.db.conn
  "Contains db connections."
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.config :as config]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.util :as gp-util]
            [datascript.core :as d]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (if (util/starts-with? url "http")
    (->> (take-last 2 (string/split url #"/"))
         (string/join "/"))
    url))

(defn get-repo-name
  [repo]
  (cond
    (mobile-util/native-platform?)
    (text/get-graph-name-from-path repo)

    (config/local-db? repo)
    (config/get-local-dir repo)

    :else
    (get-repo-path repo)))

(defn get-short-repo-name
  "repo-path: output of `get-repo-name`"
  [repo-path]
  (if (or (util/electron?)
          (mobile-util/native-platform?))
    (text/get-file-basename repo-path)
    repo-path))

(defn datascript-db
  [repo]
  (when repo
    (let [path (get-repo-path repo)]
      (str (if (util/electron?) "" config/idb-db-prefix)
           path))))

(defn get-db
  ([]
   (get-db (state/get-current-repo) true))
  ([repo-or-deref?]
   (if (boolean? repo-or-deref?)
     (get-db (state/get-current-repo) repo-or-deref?)
     (get-db repo-or-deref? true)))
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
  [_db {:keys [name email avatar]}]
  (gp-util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))

(defn start!
  ([me repo]
   (start! me repo {}))
  ([me repo {:keys [listen-handler]}]
   (let [db-name (datascript-db repo)
         db-conn (gp-db/start-conn)]
     (swap! conns assoc db-name db-conn)
     (when me
       (d/transact! db-conn [(me-tx (d/db db-conn) me)]))
     (when listen-handler
       (listen-handler repo)))))

(defn destroy-all!
  []
  (reset! conns {}))
