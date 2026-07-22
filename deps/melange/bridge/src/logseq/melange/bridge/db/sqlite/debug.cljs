(ns logseq.melange.bridge.db.sqlite.debug
  "SQLite debug fns"
  (:require ["@logseq/melange-js-api/db" :as melange-db]))

(def ^:private sqlite-debug-workflow-api (.-SqliteDebugWorkflow melange-db))

(defn find-missing-addresses
  "WASM version to find missing addresses from the kvs table"
  [^Object db]
  (set
   (seq
    ((.-findMissingWasm sqlite-debug-workflow-api) db))))

(defn find-missing-addresses-node-version
  "Node version to find missing addresses from the kvs table"
  [^Object db]
  (set
   (seq
    ((.-findMissingNode sqlite-debug-workflow-api) db))))
