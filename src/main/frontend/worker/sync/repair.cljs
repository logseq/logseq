(ns frontend.worker.sync.repair
  "Builds and applies db-sync repair transactions for missing block data.

  Repair transactions are used only after the server reports missing blocks or
  when applying remote txs needs server-provided block data."
  (:require [logseq.db :as ldb]
            [frontend.worker.sync.crypt :as sync-crypt]
            [logseq.db-sync.repair :as db-sync-repair]))

(def upload-repair-created-at 0)

(defn sync-fix-tx-meta
  []
  {:outliner-op :fix
   :gen-undo-ops? false
   :db-sync/tx-id (random-uuid)})

(defn local-repair-tx-data
  [db block-uuids]
  (db-sync-repair/tx-data db block-uuids))

(defn <decrypt-tx-data
  [aes-key tx-data]
  (sync-crypt/<decrypt-tx-data aes-key tx-data))

(defn apply-tx-data!
  [conn tx-data]
  (when (seq tx-data)
    (ldb/transact! conn tx-data (sync-fix-tx-meta))))
