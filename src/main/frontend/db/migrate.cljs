(ns frontend.db.migrate
  "Do DB migration, in a version-by-version style.

   `:schema/version` is not touched"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.state :as state]
            [logseq.common.path :as path]
            [logseq.db.schema :as db-schema]))


(defn get-schema-version
  "Get schema version from db, the current version is defined in db-schema/version"
  [db]
  (d/q
   '[:find (max ?v) .
     :where
     [_ :schema/version ?v]]
   db))

(defn get-collapsed-blocks
  [db]
  (d/q
   '[:find [?b ...]
     :where
     [?b :block/properties ?properties]
     [(get ?properties :collapsed) ?collapsed]
     [(= true ?collapsed)]]
   db))

(defn migrate-collapsed-blocks [db]
  (when db
    (let [collapsed-blocks (get-collapsed-blocks db)]
      (if (seq collapsed-blocks)
        (let [tx-data (map (fn [id] {:db/id id
                                     :block/collapsed? true}) collapsed-blocks)]
          (prn :migrate-collapsed-blocks {:count (count collapsed-blocks)})
          (d/db-with db tx-data))
        db))))

(defn migrate-absolute-file-path-to-relative [db]
  (when db
    (let [all-files (d/q
                     '[:find [(pull ?b [:db/id :file/path]) ...]
                       :where
                       [?b :file/path]]
                     db)
          repo-dir (config/get-repo-dir (state/get-current-repo))]
      (if (seq all-files)
        (let [tx-data (->> all-files
                           (filter (fn [db-file]
                                     (and (path/absolute? (:file/path db-file))
                                                      (string/starts-with? (:file/path db-file) repo-dir))))
                           (mapv (fn [db-file] {:db/id (:db/id db-file)
                                                :file/path (path/trim-dir-prefix repo-dir (:file/path db-file))})))]
          (when tx-data
            (state/pub-event! [:notification/show
                               {:content [:div "Migrated from an old version of DB, please re-index the graph from the graph list dropdown."]
                                :status :warning
                                :clear? false}]))
          (prn :migrate-absolute-file-path-to-relative {:count (count tx-data)})
          (d/db-with db tx-data))
        db))))


(defmulti do-migration get-schema-version)

(defmethod do-migration 0
  [db]
  (-> db
      migrate-collapsed-blocks
      migrate-absolute-file-path-to-relative))

(defmethod do-migration 1
  [db]
  (-> db
      migrate-absolute-file-path-to-relative))

(defmethod do-migration :default
  [db]
  db)

(defn migrate
  [db]
  (prn ::migrate {:from (get-schema-version db) :to db-schema/version})
  (do-migration db))
