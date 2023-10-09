(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.file-based.property :as file-property]
            [frontend.handler.file-based.page-property :as file-page-property]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [frontend.db.model :as model]
            [frontend.modules.outliner.core :as outliner-core]
            [clojure.string :as string]))

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

(defn add-page-property!
  "Sanitized page-name, unsanitized key / value"
  [page-name key value]
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (when-let [page (db/pull [:block/name (util/page-name-sanity-lc page-name)])]
       (set-block-property! repo (:block/uuid page) key value))
      (file-page-property/add-property! page-name key value))))

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

(defn class-set-schema!
  [repo class-uuid schema]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (config/db-based-graph? repo)
      (db-property-handler/class-set-schema! repo class schema))))

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

(defn- get-namespace-parents
  [tags]
  (let [tags' (filter (fn [tag] (contains? (:block/type tag) "class")) tags)
        *namespaces (atom #{})]
    (doseq [tag tags']
      (when-let [ns (:block/namespace tag)]
        (loop [current-ns ns]
          (when (and
                 current-ns
                 (contains? (:block/type ns) "class")
                 (not (contains? @*namespaces (:db/id ns))))
            (swap! *namespaces conj current-ns)
            (recur (:block/namespace current-ns))))))
    @*namespaces))

(defn get-block-classes-properties
  [eid]
  (let [block (db/entity eid)
        classes (->> (:block/tags block)
                     (sort-by :block/name)
                     (filter (fn [tag] (contains? (:block/type tag) "class"))))
        namespace-parents (get-namespace-parents classes)
        all-classes (->> (concat classes namespace-parents)
                         (filter (fn [class]
                                   (seq (:properties (:block/schema class))))))
        all-properties (-> (mapcat (fn [class]
                                     (seq (:properties (:block/schema class)))) all-classes)
                           distinct)]
    {:classes classes
     :all-classes all-classes           ; block own classes + parent classes
     :classes-properties all-properties}))

(defn enum-other-position?
  [property-id block-properties]
  (and
   (some? (get block-properties property-id))
   (let [schema (:block/schema (db/entity [:block/uuid property-id]))]
     (and (= :enum (:type schema))
          (not= (:position schema) "properties")))))

(defn get-block-enum-other-position-properties
  [eid]
  (let [block (db/entity eid)
        own-properties (keys (:block/properties block))]
    (->> (:classes-properties (get-block-classes-properties eid))
         (concat own-properties)
         (filter (fn [id] (enum-other-position? id (:block/properties block))))
         (distinct))))

(defn block-has-viewable-properties?
  [block-entity]
  (let [properties (:block/properties block-entity)]
    (or
     (seq (:block/alias properties))
     (and (seq properties)
          (not= (keys properties) [(:block/uuid (db/entity [:block/name "icon"]))])))))

(defn property-create-new-block
  [block property value parse-block]
  (let [current-page-id (:block/uuid (or (:block/page block) block))
        page-name (str "$$$" current-page-id)
        page-entity (db/entity [:block/name page-name])
        page (or page-entity
                 (-> (block/page-name->map page-name true)
                     (assoc :block/type #{"hidden"})))
        page-tx (when-not page-entity page)
        page-id [:block/uuid (:block/uuid page)]
        parent-id (db/new-block-id)
        metadata {:created-from-block (:block/uuid block)
                  :created-from-property (:block/uuid property)}
        parent (-> {:block/uuid parent-id
                    :block/format :markdown
                    :block/content ""
                    :block/page page-id
                    :block/parent page-id
                    :block/left (or (when page-entity (model/get-block-last-direct-child (db/get-db) (:db/id page-entity)))
                                    page-id)
                    :block/metadata metadata}
                   outliner-core/block-with-timestamps)
        child-1-id (db/new-block-id)
        child-1 (-> {:block/uuid child-1-id
                     :block/format :markdown
                     :block/content value
                     :block/page page-id
                     :block/parent [:block/uuid parent-id]
                     :block/left [:block/uuid parent-id]
                     :block/metadata metadata}
                    outliner-core/block-with-timestamps
                    parse-block)]
    {:page page-tx
     :blocks [parent child-1]}))

(defn property-create-new-block-from-template
  [block property template]
  (let [current-page-id (:block/uuid (or (:block/page block) block))
        page-name (str "$$$" current-page-id)
        page-entity (db/entity [:block/name page-name])
        page (or page-entity
                 (-> (block/page-name->map page-name true)
                     (assoc :block/type #{"hidden"})))
        page-tx (when-not page-entity page)
        page-id [:block/uuid (:block/uuid page)]
        block-id (db/new-block-id)
        metadata {:created-from-block (:block/uuid block)
                  :created-from-property (:block/uuid property)
                  :created-from-template (:block/uuid template)}
        new-block (-> {:block/uuid block-id
                       :block/format :markdown
                       :block/content ""
                       :block/tags #{(:db/id template)}
                       :block/page page-id
                       :block/metadata metadata
                       :block/parent page-id
                       :block/left (or (when page-entity (model/get-block-last-direct-child (db/get-db) (:db/id page-entity)))
                                       page-id)}
                      outliner-core/block-with-timestamps)]
    {:page page-tx
     :blocks [new-block]}))
