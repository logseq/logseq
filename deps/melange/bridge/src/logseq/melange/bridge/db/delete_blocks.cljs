(ns logseq.melange.bridge.db.delete-blocks
  "DataScript capabilities for the typed Melange delete workflow."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private delete-workflow-api (.-DeleteWorkflow melange-db))

(defn expand-delete-blocks-tx
  "Expands delete-block retracts to the current DB subtree before transacting."
  [db txs tx-meta]
  ((.-expandWith delete-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   txs
   tx-meta))

(defn update-refs-history
  "Returns cleanup transactions for references and property history."
  [db txs _opts]
  (seq
   ((.-cleanupWith delete-workflow-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    txs)))
