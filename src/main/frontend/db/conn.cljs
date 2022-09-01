(ns frontend.db.conn
  "Contains db connections."
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.util.text :as text-util]
            [logseq.graph-parser.text :as text]
            [logseq.db :as ldb]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (when url
    (if (util/starts-with? url "http")
      (->> (take-last 2 (string/split url #"/"))
           (string/join "/"))
      url)))

(defn get-repo-name
  [repo]
  (cond
    (mobile-util/native-platform?)
    (text-util/get-graph-name-from-path repo)

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

(defn start!
  ([repo]
   (start! repo {}))
  ([repo {:keys [listen-handler]}]
   (let [db-name (datascript-db repo)
         db-conn (ldb/start-conn)]
     (swap! conns assoc db-name db-conn)
     (when listen-handler
       (listen-handler repo)))))

(defn destroy-all!
  []
  (reset! conns {}))
