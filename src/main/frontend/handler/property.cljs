(ns frontend.handler.property
  "Property fns for both file and DB graphs"
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.file-based.page-property :as file-page-property]
            [frontend.config :as config]
            [frontend.state :as state]))

(defn remove-block-property!
  [repo block-id property-id-or-key]
  (if (config/db-based-graph? repo)
    (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)]
      (db-property-handler/remove-block-property! eid property-id-or-key))
    (file-property-handler/remove-block-property! block-id property-id-or-key)))

(defn set-block-property!
  [repo block-id key v]
  (if (config/db-based-graph? repo)
    (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)]
      (if (or (nil? v) (and (coll? v) (empty? v)))
        (db-property-handler/remove-block-property! eid key)
        (db-property-handler/set-block-property! eid key v)))
    (file-property-handler/set-block-property! block-id key v)))

(defn add-page-property!
  "Sanitized page-name, unsanitized key / value"
  [page-entity key value]
  (when page-entity
    (let [repo (state/get-current-repo)]
      (if (config/db-based-graph? repo)
        (set-block-property! repo (:block/uuid page-entity) key value)
        (file-page-property/add-property! page-entity key value)))))

(defn set-editing-new-property!
  [value]
  (state/set-state! :editor/new-property-input-id value))

(defn editing-new-property!
  ([]
   (editing-new-property! (state/get-edit-input-id)))
  ([input-id]
   (set-editing-new-property! input-id)
   (state/clear-edit!)))

(defn remove-id-property
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (file-property-handler/remove-id-property format content)))

(defn file-persist-block-id!
  [repo block-id]
  (when-not (config/db-based-graph? repo)
    (file-property-handler/set-block-property! block-id :id (str block-id))))

(defn batch-remove-block-property!
  [repo block-ids key]
  (if (config/db-based-graph? repo)
    (db-property-handler/batch-remove-property! block-ids key)
    (file-property-handler/batch-remove-block-property! block-ids key)))

(defn batch-set-block-property!
  [repo block-ids key value]
  (if (config/db-based-graph? repo)
    (if (nil? value)
      (db-property-handler/batch-remove-property! block-ids key)
      (db-property-handler/batch-set-property! block-ids key value))
    (file-property-handler/batch-set-block-property! block-ids key value)))
