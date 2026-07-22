(ns logseq.melange.bridge.db.sqlite.build
  "ClojureScript adapters for the Melange SQLite graph build workflow."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as datascript]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private sqlite-build-api (.-SqliteBuild melange-db))
(def ^:private sqlite-build-workflow-api (.-SqliteBuildWorkflow melange-db))

(defn block-property-value?
  [value]
  ((.-blockPropertyValueWith sqlite-build-api)
   (runtime/runtime-adapter)
   value))

(defn page-prop-value?
  [value]
  ((.-pagePropertyValueWith sqlite-build-api)
   (runtime/runtime-adapter)
   value))

(def new-db-id
  "Returns the next temporary DataScript ID used by graph build transactions."
  #((.-nextTempId sqlite-build-api)))

(defn get-used-properties-from-options
  "Returns every property used by graph build options and its observed values."
  [options]
  ((.-getUsedPropertiesWith sqlite-build-api)
   (runtime/runtime-adapter)
   options))

(defn extract-from-blocks
  "Applies f to every block, including nested :build/children blocks."
  [blocks f]
  ((.-extractBlocksWith sqlite-build-api)
   (runtime/runtime-adapter)
   blocks
   f))

(defn update-each-block
  "Applies f to every block, including nested :build/children blocks."
  [blocks f]
  ((.-updateBlocksWith sqlite-build-api)
   (runtime/runtime-adapter)
   blocks
   f))

(defn validate-options
  "Fails when SQLite graph build options are malformed or incomplete."
  [options]
  ((.-validateOptionsWith sqlite-build-workflow-api)
   (runtime/runtime-adapter)
   options))

(defn build-blocks-tx
  "Builds :init-tx and :block-props-tx DataScript transactions from graph EDN."
  [options]
  ((.-buildBlocksTx sqlite-build-workflow-api)
   (runtime/runtime-adapter)
   options))

(defn create-blocks
  "Builds and transacts graph EDN. A vector is shorthand for :pages-and-blocks."
  [connection options]
  ((.-createBlocksInput sqlite-build-workflow-api)
   (runtime/runtime-adapter)
   (datascript/adapter)
   connection
   options))
