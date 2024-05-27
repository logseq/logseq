(ns frontend.db.conn
  "Contains db connections."
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.util.text :as text-util]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.db :as gp-db]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.schema :as db-schema]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (assert (string? url) (str "url is not a string: " (type url)))
  url)

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
                     (common-util/safe-decode-uri-component (text/get-file-basename repo-name))

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

(defn remove-conn!
  [repo]
  (swap! conns dissoc (datascript-db repo)))

(if util/node-test?
  (defn transact!
    ([repo tx-data]
     (transact! repo tx-data nil))
    ([repo tx-data tx-meta]
     (ldb/transact! (get-db repo false) tx-data tx-meta)))
  (defn transact!
    ([repo tx-data]
     (transact! repo tx-data nil))
    ([repo tx-data tx-meta]
     (ldb/transact! repo tx-data tx-meta))))

(defn start!
  ([repo]
   (start! repo {}))
  ([repo {:keys [listen-handler]}]
   (let [db-name (datascript-db repo)
         db-conn (if (config/db-based-graph? repo)
                   (d/create-conn db-schema/schema-for-db-based-graph)
                   (gp-db/start-conn))]
     (swap! conns assoc db-name db-conn)
     (when listen-handler
       (listen-handler repo)))))

(defn destroy-all!
  []
  (reset! conns {}))
