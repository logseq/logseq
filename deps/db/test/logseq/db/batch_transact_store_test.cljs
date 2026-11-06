(ns ^:node-only logseq.db.batch-transact-store-test
  "batch-transact! keeps the in-memory db and the graph file in agreement when
  it fails after its store"
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn- open-seeded-graph!
  []
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-db-batch-store-"))
        path (node-path/join dir "db.sqlite")
        sqlite (new sqlite-cli/sqlite path nil)
        _ (common-sqlite/create-kvs-table! sqlite)
        conn (common-sqlite/get-storage-conn (sqlite-cli/new-sqlite-storage sqlite) db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    {:path path :sqlite sqlite :conn conn}))

(defn- add-page! [conn title]
  (ldb/transact! conn [(sqlite-util/build-new-page title)]))

(deftest batch-listener-error-after-store-keeps-batch-in-memory
  (let [{:keys [path conn ^js sqlite]} (open-seeded-graph!)
        _ (add-page! conn "p1")
        _ (d/listen! conn ::throws (fn [report]
                                     (when (:batch-final-tx-report? (:tx-meta report))
                                       (throw (js/Error. "listener failed")))))
        batch-error (try (ldb/batch-transact! conn {} #(add-page! % "batch page")) nil
                         (catch :default e (ex-message e)))
        _ (d/unlisten! conn ::throws)
        in-memory? (some? (ldb/get-page @conn "batch page"))
        _ (.close sqlite)
        {reopened :conn ^js reopened-sqlite :sqlite} (sqlite-cli/open-sqlite-datascript! path)
        on-disk? (some? (ldb/get-page @reopened "batch page"))]
    (is (= "listener failed" batch-error) "The listener's error reaches the caller")
    (is on-disk? "The stored batch is in the graph file")
    (is (= on-disk? in-memory?) "The in-memory db holds what the graph file holds")
    (.close reopened-sqlite)))

(deftest batch-error-before-store-rolls-back-memory
  (let [{:keys [conn ^js sqlite]} (open-seeded-graph!)
        batch-error (try (ldb/batch-transact! conn {} (fn [conn]
                                                         (add-page! conn "batch page")
                                                         (throw (js/Error. "batch failed"))))
                         nil
                         (catch :default e (ex-message e)))]
    (is (= "batch failed" batch-error))
    (is (nil? (ldb/get-page @conn "batch page")) "A batch that failed before its store is rolled back")
    (.close sqlite)))
