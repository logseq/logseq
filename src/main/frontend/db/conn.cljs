(ns frontend.db.conn
  "Contains db connections."
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.util.text :as text-util]
            [logseq.graph-parser.text :as text]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.graph-parser.util :as gp-util]
            [datascript.core :as d]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (when url
    (if (util/starts-with? url "http")
      (->> (take-last 2 (string/split url #"/"))
           util/string-join-path)
      url)))

(defn get-repo-name
  [repo-url]
  (cond
    (mobile-util/native-platform?)
    (text-util/get-graph-name-from-path repo-url)

    (config/local-file-based-graph? repo-url)
    (config/get-local-dir repo-url)

    :else
    (get-repo-path repo-url)))

(defn get-short-repo-name
  "repo-name: from get-repo-name. Dir/Name => Name"
  [repo-name]
  (let [repo-name' (cond
                     (util/electron?)
                     (text/get-file-basename repo-name)

                     (mobile-util/native-platform?)
                     (gp-util/safe-decode-uri-component (text/get-file-basename repo-name))

                     :else
                     repo-name)]
    (if (config/db-based-graph? repo-name')
      (string/replace-first repo-name' config/db-version-prefix "")
      repo-name')))

(defn datascript-db
  [repo]
  (when repo
    (let [path (get-repo-path repo)]
      (str (if (util/electron?) "" config/idb-db-prefix)
           path))))

(defn get-schema
  "Returns schema for given repo"
  [repo]
  (if (config/db-based-graph? repo)
    db-schema/schema-for-db-based-graph
    db-schema/schema))

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

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

(defn start!
  ([repo]
   (start! repo {}))
  ([repo {:keys [listen-handler db-graph?]}]
   (let [db-name (datascript-db repo)
         db-conn (ldb/start-conn :schema (get-schema repo) :create-default-pages? false)]
     (swap! conns assoc db-name db-conn)
     (when db-graph?
       (d/transact! db-conn [(kv :db/type "db")])
       (d/transact! db-conn [(kv :schema/version db-schema/version)]))
     (when listen-handler
       (listen-handler repo))
     (ldb/create-default-pages! db-conn {:db-graph? db-graph?}))))

(defn destroy-all!
  []
  (reset! conns {}))
