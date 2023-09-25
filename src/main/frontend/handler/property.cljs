(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.file-based.property :as file-property]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]))

(def user-face-builtin-schema-types db-property-handler/user-face-builtin-schema-types)
(def internal-builtin-schema-types db-property-handler/internal-builtin-schema-types)

(defn remove-block-property!
  [repo block-id key]
  (if (config/db-based-graph? repo)
    (db-property-handler/remove-block-property! repo block-id key)
    (file-property/remove-block-property! block-id key)))

(defn set-block-property!
  [repo block-id key v & opts]
  (if (config/db-based-graph? repo)
    (if (or (nil? v) (and (coll? v) (empty? v)))
      (db-property-handler/remove-block-property! repo block-id key)
      (db-property-handler/set-block-property! repo block-id key v opts))
    (file-property/set-block-property! block-id key v)))

(defn update-property!
  [repo property-uuid opts]
  {:pre [(uuid? property-uuid)]}
  (when (config/db-based-graph? repo)
    (db-property-handler/update-property! repo property-uuid opts)))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [repo block property-id property-value]
  (when (config/db-based-graph? repo)
    (db-property-handler/delete-property-value! repo block property-id property-value)))

(defn set-editing-new-property!
  [value]
  (state/set-state! :ui/new-property-input-id value))

(defn editing-new-property!
  []
  (set-editing-new-property! (state/get-edit-input-id))
  (state/clear-edit!))

(defn class-add-property!
  [repo class-uuid k-name]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (config/db-based-graph? repo)
     (db-property-handler/class-add-property! repo class k-name))))

(defn class-remove-property!
  [repo class-uuid k-uuid]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (config/db-based-graph? repo)
     (db-property-handler/class-remove-property! repo class k-uuid))))

(defn remove-id-property
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (file-property/remove-id-property format content)))

(defn file-persist-block-id!
  [repo block-id]
  (when-not (config/db-based-graph? repo)
    (file-property/set-block-property! block-id :id (str block-id))))

(defn batch-remove-block-property!
  [repo block-ids key]
  (if (config/db-based-graph? repo)
    (db-property-handler/batch-remove-property! repo block-ids key)
    (file-property/batch-remove-block-property! block-ids key)))

(defn batch-set-block-property!
  [repo block-ids key value]
  (if (config/db-based-graph? repo)
    (if (nil? value)
      (db-property-handler/batch-remove-property! repo block-ids key)
      (db-property-handler/batch-set-property! repo block-ids key value))
    (file-property/batch-set-block-property! block-ids key value)))

(defn file-batch-set-property!
  [repo col]
  (when-not (config/db-based-graph? repo)
    (file-property/batch-set-block-property-aux! col)))

(defn replace-key-with-id!
  [repo m]
  (if (config/db-based-graph? repo)
    (db-property-handler/replace-key-with-id! m)
    m))

(defn collapse-expand-property!
  "Notice this works only if the value itself if a block (property type should be either :default or :template)"
  [repo block property collapse?]
  (when (config/db-based-graph? repo)
    (db-property-handler/collapse-expand-property! repo block property collapse?)))
