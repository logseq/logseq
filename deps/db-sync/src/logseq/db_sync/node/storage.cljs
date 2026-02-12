(ns logseq.db-sync.node.storage
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.common.sqlite :as common-sqlite]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- ensure-dir! [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn- normalize-sql [sql]
  (-> sql string/trim string/lower-case))

(defn- select-sql? [sql]
  (string/starts-with? (normalize-sql sql) "select"))

(defn- exec-with-args [^js stmt args]
  (.apply (.-run stmt) stmt (to-array args)))

(defn- all-with-args [^js stmt args]
  (.apply (.-all stmt) stmt (to-array args)))

(defn- wrap-db [^js db]
  #js {:exec (fn [sql & args]
               (if (seq args)
                 (let [stmt (.prepare db sql)]
                   (if (select-sql? sql)
                     (all-with-args stmt args)
                     (do
                       (exec-with-args stmt args)
                       nil)))
                 (if (select-sql? sql)
                   (.all (.prepare db sql))
                   (.exec db sql))))
       :prepare (fn [sql] (.prepare db sql))
       :close (fn [] (.close db))
       :_db db})

(defn open-index-db [data-dir]
  (let [db-path (node-path/join data-dir "index.sqlite")]
    (ensure-dir! (node-path/dirname db-path))
    (wrap-db (new sqlite db-path nil))))

(defn open-graph-db [data-dir graph-id]
  (let [[graph-name db-path] (common-sqlite/get-db-full-path (node-path/join data-dir "graphs") graph-id)]
    (ensure-dir! (node-path/dirname db-path))
    {:graph-name graph-name
     :sql (wrap-db (new sqlite db-path nil))}))
