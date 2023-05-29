(ns logseq.tasks.validate-sqlite-data
  (:require [pod.babashka.go-sqlite3 :as sqlite]
            [babashka.fs :as fs]))

(defn get-all-normal-blocks
  [db-path]
  (sqlite/query db-path "select * from blocks where type = 1"))


(defn get-all-page-blocks
  [db-path]
  (sqlite/query db-path "select * from blocks where type = 2"))



(defn all-normal-blocks-have-page-uuid
  [all-page-blocks all-normal-blocks]
  (let [page-block-uuids (set (mapv :uuid all-page-blocks))]
    (loop [[b & others] all-normal-blocks]
      (when b
        (assert (and (:uuid b) (contains? page-block-uuids (:page_uuid b))) b)
        (recur others)))))

(defn -main
  [& args]
  (prn args)
  (let [db-graph-name (first args)
        db-path (str (fs/path (fs/home) "logseq" "graphs" db-graph-name))]
    (assert (fs/exists? db-path) db-path)
    (let [all-page-blocks (get-all-page-blocks db-path)
          all-normal-blocks (get-all-normal-blocks db-path)]
      (all-normal-blocks-have-page-uuid all-page-blocks all-normal-blocks))))
