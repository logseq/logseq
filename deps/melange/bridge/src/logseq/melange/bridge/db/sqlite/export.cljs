(ns logseq.melange.bridge.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
  Useful for exporting and importing across DB graphs"
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [clojure.data :as data]
            [logseq.melange.bridge.runtime :as melange-keyword]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.melange.bridge.db.schema :as schema-catalog]))

(def ^:private sqlite-export-api (.-SqliteExport melange-db))
(def ^:private sqlite-export-workflow-api (.-SqliteExportWorkflow melange-db))

(defn sort-pages-and-blocks
  "Provide a reliable sort order since this tends to be large. Helps with diffing
   and readability"
  [pages-and-blocks]
  ((.-sortPagesWith sqlite-export-api)
   (melange-keyword/runtime-adapter)
   pages-and-blocks))

(defn remove-uuids-if-not-ref [export-map all-ref-uuids]
  ((.-pruneUnreferencedUuidsWith sqlite-export-workflow-api)
   (melange-keyword/runtime-adapter)
   export-map
   all-ref-uuids))
(defn build-export
  "Handles exporting db by given export-type. Most export options are meant for
  a human to edit and read except for :graph with :datoms.  There are two
  graph-wide exports, :graph and :graph-human. :graph is designed to be simple,
  reliable and for machines. :graph-human is designed for humans to read, edit
  and instill confidence that their full graph's data is accessible to them.
  :graph-human comes with a number of options to customize the export's
  granularity including toggling export of timestamps, files and certain
  namespaces. See build-graph-export for more"
  [db options]
  ((.-buildExportWith sqlite-export-workflow-api)
   (melange-keyword/runtime-adapter)
   (d/adapter)
   db
   #js {:logValidationError #(println "Caught error:" %)}
   schema-catalog/version
   options))

;; Import fns
;; ==========

(defn build-import
  "Given an export map, build the import tx to create it. In addition to standard sqlite.build keys,
   an export map can have the following namespaced keys:
   * :logseq.db.sqlite.export/export-type - Keyword indicating export type
   * :logseq.db.sqlite.export/block - Block map for a :block export
   * :datoms - Vec of [e a v] datom tuples for a :graph export
   * :logseq.db.sqlite.export/graph-files - Vec of files for a :graph-human export
   * :logseq.db.sqlite.export/kv-values - Vec of :kv/value maps for a :graph-human export
   * :logseq.db.sqlite.export/property-history - Set of property history blocks for a :graph-human export
   * :logseq.db.sqlite.export/auto-include-namespaces - A set of parent namespaces to include from properties and classes
     for a :graph-human export. See :exclude-namespaces in build-graph-export for a similar option
   * :logseq.db.sqlite.export/import-options - A map of options that alters importing behavior. Has the following keys:
     * :existing-pages-keep-properties? - Boolean which allows existing pages to keep existing properties

   This fn then returns a map of txs to transact with the following keys:
   * :init-tx - Txs that must be transacted first, usually because they define new properties
   * :block-props-tx - Txs to transact after :init-tx, usually because they use newly defined properties
   * :misc-tx - Txs to transact unrelated to other txs"
  [export-map db options]
  ((.-buildImport sqlite-export-workflow-api)
   (melange-keyword/runtime-adapter)
   (d/adapter)
   export-map
   db
   options))

(defn import-tx-data
  [transactions]
  ((.-importTransactionDataWith sqlite-export-api)
   (melange-keyword/runtime-adapter)
   transactions))

(defn- import-validation-result->map
  [^js result]
  (if-let [error (.-error result)]
    {:error error}
    {:db (.-database result)
     :tx-data (.-transactionData result)}))

(defn validate-import-txs
  "Dry-runs import txs against db and validates the resulting local DB.
   Returns {:db db-after :tx-data tx-data} when valid or {:error string} when invalid."
  ([txs db]
   (validate-import-txs txs db {:edn-label "imported EDN"}))
  ([txs db {:keys [edn-label]
            :or {edn-label "imported EDN"}}]
   (import-validation-result->map
    ((.-validateImportTransactionsWith sqlite-export-workflow-api)
     (melange-keyword/runtime-adapter)
     (d/adapter)
     txs
     db
     edn-label))))

(defn create-conn
  "Create a conn for a DB graph seeded with initial data"
  []
  ((.-createSeededConnectionWith sqlite-export-workflow-api)
   (d/adapter)
   schema-catalog/schema
   (sqlite-create-graph/build-db-initial-data "{}")))

(defn validate-export
  "Validates an export by creating an in-memory DB graph, importing the EDN and validating the graph.
   Returns a map with a readable :error key if any error occurs"
  [export-edn]
  (import-validation-result->map
   ((.-validateSeededExport sqlite-export-workflow-api)
    (melange-keyword/runtime-adapter)
    (d/adapter)
    export-edn
    schema-catalog/schema
    (sqlite-create-graph/build-db-initial-data "{}")
    {})))

(defn diff-exports
  "Given two graph export edns, return a vector of diffs when there is a diff and nil when there is
   no diff between the two"
  [export-map export-map2]
  ((.-diffExportsWith sqlite-export-workflow-api)
   (melange-keyword/runtime-adapter)
   #js {:diffValues data/diff}
   export-map
   export-map2))
