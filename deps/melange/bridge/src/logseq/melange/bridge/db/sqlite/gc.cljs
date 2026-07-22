(ns logseq.melange.bridge.db.sqlite.gc
  "One-hop SQLite garbage-collection workflow boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]))

(def ^:private sqlite-gc-api (.-SqliteGcWorkflow melange-db))

(defn gc-kvs-table!
  "WASM version to remove unused addresses from the kvs table."
  [db {:keys [full-gc?]}]
  ((.-collectWasmDefault sqlite-gc-api) db (boolean full-gc?)))

(defn gc-kvs-table-node-version!
  "Node version to remove unused addresses from the kvs table."
  [db walk?]
  ((.-collectNodeDefault sqlite-gc-api) db (boolean walk?)))

(defn ensure-no-garbage
  [db]
  ((.-ensureNoGarbageDefault sqlite-gc-api) db))
