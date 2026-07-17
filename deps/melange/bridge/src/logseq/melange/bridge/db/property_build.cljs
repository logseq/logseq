(ns logseq.melange.bridge.db.property-build
  "DB property value representation and capability boundary."
  (:require ["@logseq/melange-js-api/common" :as melange-common]
            ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.common.uuid :as melange-uuid]
            [logseq.melange.bridge.db.order :as db-order]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private property-build-api (.-PropertyBuild melange-db))
(def ^:private date-time-api (.-DateTime melange-common))

(defn build-properties-with-ref-values
  "Builds property reference values from lookup refs or value-block maps."
  [property-values]
  ((.-buildPropertiesWithRefValuesWith property-build-api)
   (runtime/runtime-adapter)
   property-values))

(defn build-property-value-block
  "Builds a property value block while retaining CLJS values at this boundary."
  [block property value & {:keys [block-uuid properties]}]
  ((.-buildValueBlockWith property-build-api)
   (runtime/runtime-adapter)
   melange-uuid/gen
   db-order/gen-key
   (fn [] ((.-nowMs date-time-api)))
   block
   property
   value
   #js {:blockUuid block-uuid
        :properties properties}))

(defn build-closed-value-block
  "Builds a closed property value block at the CLJS representation boundary."
  [block-uuid block-type block-value property {:keys [db-ident icon]}]
  ((.-buildClosedValueBlockWith property-build-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs date-time-api)))
   block-uuid
   block-type
   block-value
   property
   #js {:dbIdent db-ident
        :icon icon}))

(defn build-property-values-tx-m
  "Builds property value transactions while retaining heterogeneous values in CLJS."
  [block properties & {:keys [pure? pvalue-map?]}]
  ((.-buildPropertyValuesWith property-build-api)
   (runtime/runtime-adapter)
   melange-uuid/gen
   db-order/gen-key
   (fn [] ((.-nowMs date-time-api)))
   block
   properties
   #js {:pure (boolean pure?)
        :pvalueMap (boolean pvalue-map?)}))

(defn closed-values->blocks
  "Builds ordered closed-value blocks from a property definition."
  [property]
  ((.-closedValuesToBlocksWith property-build-api)
   (runtime/runtime-adapter)
   db-order/gen-key
   (fn [] ((.-nowMs date-time-api)))
   property))

(defn build-closed-values
  "Builds a property transaction and its closed values with injected DB capabilities."
  [db-ident prop-name property config
   & {:keys [get-property-schema build-new-property]}]
  ((.-buildClosedValuesWith property-build-api)
   (runtime/runtime-adapter)
   db-order/gen-key
   (fn [] ((.-nowMs date-time-api)))
   db-ident
   prop-name
   property
   config
   (when (fn? get-property-schema)
     (fn [value]
       (get-property-schema value)))
   (when (fn? build-new-property)
     (fn [input]
       (build-new-property
        (:db-ident input)
        (:schema input)
        {:title (:title input)
         :ref-type? (:ref-type? input)
         :properties (:properties input)})))))
