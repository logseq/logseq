(ns frontend.worker.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db :as ldb]))

(deftest ensure-built-in-data-exists!
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        initial-version (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version))
        graph-created-at (:kv/value (d/entity @conn :logseq.kv/graph-created-at))
        _ (assert (= {:major 64 :minor 8} initial-version))
        _ (assert (some? graph-created-at))
        _ (db-migrate/ensure-built-in-data-exists! conn)]
    (is (= initial-version
           (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version)))
        "Initial version not changed by fn")
    (is (= graph-created-at
           (:kv/value (d/entity @conn :logseq.kv/graph-created-at)))
        "Graph created at not changed by fn")))
