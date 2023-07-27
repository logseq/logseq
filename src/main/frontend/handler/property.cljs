(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.handler.db-based.property :as db-property]
            [frontend.handler.file-based.property :as file-property]
            [frontend.config :as config]
            [frontend.state :as state]))

(def builtin-schema-types db-property/builtin-schema-types)

(defn add-property!
  [repo block k-name v & opts]
  ;; TODO: Remove ignores when finished
  #_:clj-kondo/ignore
  (if (config/db-based-graph? repo)
    (db-property/add-property! repo block k-name v opts)))

(defn remove-property!
  [repo block property-uuid]
  {:pre (uuid? property-uuid)}
  #_:clj-kondo/ignore
  (if (config/db-based-graph? repo)
    (db-property/remove-property! repo block property-uuid)))

(defn update-property!
  [repo property-uuid opts]
  {:pre [(uuid? property-uuid)]}
  #_:clj-kondo/ignore
  (if (config/db-based-graph? repo)
    (db-property/update-property! repo property-uuid opts)))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [repo block property-id property-value]
  #_:clj-kondo/ignore
  (if (config/db-based-graph? repo)
    (db-property/delete-property-value! repo block property-id property-value)))

(defn set-editing-new-property!
  [value]
  (state/set-state! :ui/new-property-input-id value))

(defn editing-new-property!
  []
  (set-editing-new-property! (state/get-edit-input-id))
  (state/clear-edit!))

(defn class-add-property!
  [repo class k-name]
  (when (config/db-based-graph? repo)
    (db-property/class-add-property! repo class k-name)))

(defn class-remove-property!
  [repo class k-uuid]
  (when (config/db-based-graph? repo)
    (db-property/class-remove-property! repo class k-uuid)))

(defn remove-id-property
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (file-property/remove-id-property format content)))
