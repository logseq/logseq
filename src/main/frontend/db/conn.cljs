(ns frontend.db.conn
  "Contains db connections."
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db.conn-state :as db-conn-state]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [logseq.melange.bridge.common.log :as common-log]
            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.schema :as db-schema]))

(defonce conns db-conn-state/conns)
(def get-repo-path db-conn-state/get-repo-path)

(defn get-db
  ([]
   (get-db (state/get-current-repo) true))
  ([repo-or-deref?]
   (if (boolean? repo-or-deref?)
     (get-db (state/get-current-repo) repo-or-deref?)
     (get-db repo-or-deref? true)))
  ([repo deref?]
   (when-let [repo (or repo (state/get-current-repo))]
     (when-let [conn (db-conn-state/get-conn repo)]
       (if deref?
         @conn
         conn)))))

(defn get-repo-name
  [repo-url]
  (cond
    (mobile-util/native-platform?)
    (text-util/get-graph-name-from-path repo-url)

    :else
    (db-conn-state/get-repo-path repo-url)))

(defn get-short-repo-name
  "repo-name: from get-repo-name. Dir/Name => Name"
  [repo-name]
  (let [repo-name' (cond
                     (util/electron?)
                     (melange-common/get-file-basename repo-name)

                     (mobile-util/native-platform?)
                     (melange-common/safe-decode-uri-component
                      (melange-common/get-file-basename repo-name)
                      #(common-log/error :decode-uri-component-failed %))

                     :else
                     repo-name)]
    (if (config/db-based-graph? repo-name')
      (config/db-graph-name repo-name')
      repo-name')))

(defn remove-conn!
  [repo]
  (swap! conns dissoc (db-conn-state/get-repo-path repo)))

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

(defn destroy-all!
  []
  (reset! conns {}))

(defn start!
  ([repo]
   (start! repo {}))
  ([repo {:keys [listen-handler]}]
   (let [db-name (db-conn-state/get-repo-path repo)
         db-conn (d/create-conn db-schema/schema)]
     (destroy-all!)
     (swap! conns assoc db-name db-conn)
     (when listen-handler
       (listen-handler db-conn)))))
