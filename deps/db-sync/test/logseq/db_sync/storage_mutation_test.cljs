(ns logseq.db-sync.storage-mutation-test
  (:require ["better-sqlite3" :as sqlite3]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.storage :as storage]))

(def ^:private sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- memory-sql
  []
  (let [db (new sqlite ":memory:" nil)]
    #js {:exec (fn [sql-str & args]
                 (let [^js stmt (.prepare db sql-str)]
                   (if (string/starts-with? (string/lower-case (string/trim sql-str)) "select")
                     (.apply (.-all stmt) stmt (to-array args))
                     (do (.apply (.-run stmt) stmt (to-array args)) nil))))
         :close (fn [] (.close db))}))

(defn- sql-failing-outliner-op-migration
  "A sql whose `alter table ... outliner_op` throws `error`; every other statement succeeds."
  [error]
  #js {:exec (fn [sql-str & _args]
               (when (string/includes? sql-str "add column outliner_op")
                 (throw error))
               nil)})

(deftest init-schema-ignores-duplicate-outliner-op-column-thrown-as-string-test
  ;; A non-Error throwable: its message is the thrown value itself.
  (is (nil? (storage/init-schema!
             (sql-failing-outliner-op-migration "SqliteError: duplicate column name: outliner_op")))))

(deftest init-schema-rethrows-duplicate-column-error-for-another-column-test
  (is (thrown-with-msg? js/Error #"duplicate column name: other_column"
                        (storage/init-schema!
                         (sql-failing-outliner-op-migration
                          (js/Error. "duplicate column name: other_column"))))))

(deftest empty-transaction-appends-no-tx-log-entry-test
  (let [sql (memory-sql)
        conn (storage/open-conn sql)]
    (d/transact! conn [{:block/uuid (random-uuid) :block/title "x"}])
    (let [t (storage/get-t sql)
          checksum (storage/get-checksum sql)]
      (is (= 1 t))
      (d/transact! conn [])
      (is (= t (storage/get-t sql)))
      (is (= 1 (count (storage/fetch-tx-since sql 0))))
      (is (= checksum (storage/get-checksum sql))))
    (.close sql)))
