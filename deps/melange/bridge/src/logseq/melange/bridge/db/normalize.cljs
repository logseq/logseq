(ns logseq.melange.bridge.db.normalize
  "DB transaction normalization representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private normalize-api (.-NormalizePlan melange-db))

(defn remove-conflict-datoms
  "Keeps the last datom for each equal EAVT group and sorts the result by tx."
  [datoms]
  ((.-removeConflictDatomsWith normalize-api)
   (runtime/runtime-adapter)
   datoms))

(defn sort-datoms
  "Stably sorts datoms with DB identity and schema attributes first."
  [datoms]
  ((.-sortDatomsWith normalize-api)
   (runtime/runtime-adapter)
   datoms))

(defn reorder-retract-entity
  "Orders recreated retracts, affected datoms, other items, and final retracts."
  [tx-data]
  ((.-reorderRetractEntityWith normalize-api)
   (runtime/runtime-adapter)
   tx-data))

(defn remove-retract-entity-ref
  "Removes datoms that refer to an entity retracted from the provided DB."
  [db tx-data]
  ((.-removeRetractEntityRefsWith normalize-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   tx-data))

(defn replace-attr-retract-with-retract-entity-v2
  "Converts block UUID retractions to entity retractions and removes dangling refs."
  [db normalized-tx-data]
  ((.-replaceAttrRetractV2With normalize-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   normalized-tx-data))

(defn replace-attr-retract-with-retract-entity
  "Replaces stale block UUID retractions with one entity retraction per entity."
  [db-after tx-data]
  ((.-replaceAttrRetractWith normalize-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db-after
   tx-data))

(defn normalize-datom
  "Normalizes a DataScript datom to stable lookup refs or tempids."
  [db-after db-before datom]
  ((.-normalizeDatomWith normalize-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db-after
   db-before
   datom))

(defn normalize-tx-data
  "Normalizes transaction datoms to stable lookup refs and ordering."
  [db-after db-before tx-data]
  ((.-normalizeTxDataWith normalize-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db-after
   db-before
   tx-data))
