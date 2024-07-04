(ns frontend.handler.db-based.property
  "db based property handler"
  (:require [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]
            [logseq.outliner.op]
            [logseq.db.frontend.property :as db-property]
            [frontend.db :as db]
            #_:clj-kondo/ignore
            [frontend.state :as state]
            [promesa.core :as p]
            [logseq.db :as ldb]))

(defn upsert-property!
  [property-id schema property-opts]
  (p/let [result (ui-outliner-tx/transact!
                  {:outliner-op :upsert-property}
                  (outliner-op/upsert-property! property-id schema property-opts))]
    (ldb/read-transit-str result)))

(defn set-block-property!
  [block-id property-id value]
  (ui-outliner-tx/transact!
   {:outliner-op :set-block-property}
   (outliner-op/set-block-property! block-id property-id value)))

(defn set-block-properties!
  [block-id properties]
  (ui-outliner-tx/transact!
   {:outliner-op :set-block-properties}
   (doseq [[property-id value] properties]
     (outliner-op/set-block-property! block-id property-id value))))

(defn remove-block-property!
  [block-id property-id]
  (ui-outliner-tx/transact!
   {:outliner-op :remove-block-property}
   (outliner-op/remove-block-property! block-id property-id)))

(defn delete-property-value!
  [block-id property-id property-value]
  (ui-outliner-tx/transact!
   {:outliner-op :delete-property-value}
    (outliner-op/delete-property-value! block-id property-id property-value)))

(defn create-property-text-block!
  [block-id property-id value opts]
  (ui-outliner-tx/transact!
   {:outliner-op :create-property-text-block}
    (outliner-op/create-property-text-block! block-id property-id value opts)))

(defn batch-set-property!
  [block-id property-id value]
  (ui-outliner-tx/transact!
   {:outliner-op :batch-set-property}
    (outliner-op/batch-set-property! block-id property-id value)))

(defn batch-remove-property!
  [block-id property-id]
  (ui-outliner-tx/transact!
   {:outliner-op :batch-remove-property}
    (outliner-op/batch-remove-property! block-id property-id)))

(defn class-add-property!
  [class-id property-id]
  (ui-outliner-tx/transact!
   {:outliner-op :class-add-property}
    (outliner-op/class-add-property! class-id property-id)))

(defn class-remove-property!
  [class-id property-id]
  (ui-outliner-tx/transact!
   {:outliner-op :class-remove-property}
    (outliner-op/class-remove-property! class-id property-id)))

(defn batch-set-property-closed-value!
  [block-ids db-ident closed-value]
  (let [db (db/get-db)]
    (if-let [closed-value-entity (db-property/get-closed-value-entity-by-name db db-ident closed-value)]
      (batch-set-property! block-ids
                           db-ident
                           (:db/id closed-value-entity))
      (js/console.error (str "No entity found for closed value " (pr-str closed-value))))))

(defn upsert-closed-value!
  [property-id closed-value-config]
  (ui-outliner-tx/transact!
   {:outliner-op :upsert-closed-value}
   (outliner-op/upsert-closed-value! property-id closed-value-config)))

(defn delete-closed-value!
  [property-id value]
  (ui-outliner-tx/transact!
   {:outliner-op :delete-closed-value}
    (outliner-op/delete-closed-value! property-id value)))

(defn add-existing-values-to-closed-values!
  [property-id values]
  (ui-outliner-tx/transact!
   {:outliner-op :add-existing-values-to-closed-values}
    (outliner-op/add-existing-values-to-closed-values! property-id values)))
