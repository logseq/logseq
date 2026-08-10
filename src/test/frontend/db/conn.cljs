(ns frontend.db.conn
  "Test-only DataScript db connection fixtures."
  (:require [frontend.state :as state]
            [logseq.db :as ldb]))

(defonce conns (atom {}))

(defn get-repo-path
  [url]
  (assert (string? url) (str "url is not a string: " (type url)))
  url)

(defn get-db
  ([]
   (get-db (state/get-current-repo) true))
  ([repo-or-deref?]
   (if (boolean? repo-or-deref?)
     (get-db (state/get-current-repo) repo-or-deref?)
     (get-db repo-or-deref? true)))
  ([repo deref?]
   (when-let [repo (or repo (state/get-current-repo))]
     (when-let [conn (get @conns (get-repo-path repo))]
       (if deref?
         @conn
         conn)))))

(defn transact!
  ([repo tx-data]
   (transact! repo tx-data nil))
  ([repo tx-data tx-meta]
   (ldb/transact! (get-db repo false) tx-data tx-meta)))

(defn destroy-all!
  []
  (reset! conns {}))
