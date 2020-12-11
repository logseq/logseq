(ns frontend.db.declares
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.idb :as idb]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]))

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

(defn datascript-files-db
  [repo]
  (when repo
    (str "logseq-files-db/" (get-repo-path repo))))

(defn remove-db!
  [repo]
  (idb/remove-item! (datascript-db repo)))

(defn remove-files-db!
  [repo]
  (idb/remove-item! (datascript-files-db repo)))

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

(defn get-files-conn
  ([]
   (get-files-conn (state/get-current-repo)))
  ([repo]
   (get @conns (datascript-files-db repo))))

(defn reset-conn! [conn db]
  (reset! conn db))

(defn remove-conn!
  [repo]
  (swap! conns dissoc (datascript-db repo))
  (swap! conns dissoc (datascript-files-db repo)))
