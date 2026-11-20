(ns ^:node-only logseq.db.store-failure-reload-test
  "When a store throws, in any storage and at any point of the write,
  ldb/transact! and ldb/batch-transact! continue from what the storage holds,
  so the graph reopens with what the session shows"
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [datascript.storage :as ds-storage :refer [IStorage]]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn- failing-storage
  "Delegates to `inner`. While `*fault` is :throw-before the next -store throws
  without writing; while it is :throw-after the next -store writes and then
  throws."
  [inner *fault]
  (reify IStorage
    (-store [_ rows deletes]
      (let [fault @*fault]
        (reset! *fault nil)
        (case fault
          :throw-before (throw (js/Error. "disk I/O error (test)"))
          :throw-after (do (ds-storage/-store inner rows deletes)
                           (throw (js/Error. "error after the write (test)")))
          (ds-storage/-store inner rows deletes))))
    (-restore [_ addr]
      (ds-storage/-restore inner addr))))

(defn- open-graph!
  [*fault]
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-db-store-failure-"))
        path (node-path/join dir "db.sqlite")
        sqlite (new sqlite-cli/sqlite path nil)
        _ (common-sqlite/create-kvs-table! sqlite)
        storage (failing-storage (sqlite-cli/new-sqlite-storage sqlite) *fault)
        conn (common-sqlite/get-storage-conn storage db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    {:path path :sqlite sqlite :conn conn}))

(defn- add-page! [conn title]
  (ldb/transact! conn [(sqlite-util/build-new-page title)])
  (:db/id (ldb/get-page @conn title)))

(defn- blocks-tx [page-id prefix n]
  (mapv (fn [i] (sqlite-util/block-with-timestamps
                 {:block/uuid (random-uuid) :block/title (str prefix i) :block/page page-id
                  :block/parent page-id :block/order (db-order/gen-key)}))
        (range n)))

(defn- block-titles [db]
  (set (keep #(when (:block/page (d/entity db (:e %))) (:v %))
             (d/datoms db :avet :block/title))))

(defn- reopened-block-titles
  "Block titles of the graph file, or the error that reopening it throws"
  [path]
  (let [{:keys [conn sqlite]} (sqlite-cli/open-sqlite-datascript! path)]
    (try (block-titles @conn)
         (catch :default e (str e))
         (finally (.close ^js sqlite)))))

(defn- write-with-fault! [*fault fault f]
  (reset! *fault fault)
  (try (f) nil (catch :default e (ex-message e))))

(deftest transact-store-failure-then-write-reopens-with-what-memory-shows
  (doseq [fault [:throw-before :throw-after]]
    (let [*fault (atom nil)
          {:keys [path conn ^js sqlite]} (open-graph! *fault)
          page (add-page! conn "p1")
          error (write-with-fault! *fault fault #(ldb/transact! conn (blocks-tx page "a" 5)))
          _ (ldb/transact! conn (blocks-tx page "b" 5))
          _ (ldb/transact! conn (blocks-tx page "c" 1))
          in-memory (block-titles @conn)]
      (.close sqlite)
      (is (some? error) (str fault ": the faulty write throws"))
      (is (= in-memory (reopened-block-titles path))
          (str fault ": the reopened graph has the blocks the session shows")))))

(deftest batch-store-failure-then-write-reopens-with-what-memory-shows
  (doseq [fault [:throw-before :throw-after]]
    (let [*fault (atom nil)
          {:keys [path conn ^js sqlite]} (open-graph! *fault)
          page (add-page! conn "p1")
          error (write-with-fault! *fault fault
                                   #(ldb/batch-transact! conn {} (fn [conn] (ldb/transact! conn (blocks-tx page "a" 5)))))
          _ (ldb/transact! conn (blocks-tx page "b" 5))
          in-memory (block-titles @conn)]
      (.close sqlite)
      (is (some? error) (str fault ": the faulty batch throws"))
      (is (= in-memory (reopened-block-titles path))
          (str fault ": the reopened graph has the blocks the session shows")))))
