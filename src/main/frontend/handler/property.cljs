(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.file-based.page-property :as file-page-property]
            [frontend.handler.notification :as notification]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [frontend.db.model :as model]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.handler.property.util :as pu]
            [clojure.string :as string]))

(defn remove-block-property!
  [repo block-id key]
  (if (config/db-based-graph? repo)
    (db-property-handler/remove-block-property! repo block-id key)
    (file-property-handler/remove-block-property! block-id key)))

(defn set-block-property!
  [repo block-id key v & opts]
  (if (config/db-based-graph? repo)
    (if (or (nil? v) (and (coll? v) (empty? v)))
      (db-property-handler/remove-block-property! repo block-id key)
      (db-property-handler/set-block-property! repo block-id key v opts))
    (file-property-handler/set-block-property! block-id key v)))

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
    (file-property-handler/remove-id-property format content)))

(defn file-persist-block-id!
  [repo block-id]
  (when-not (config/db-based-graph? repo)
    (file-property-handler/set-block-property! block-id :id (str block-id))))

(defn batch-remove-block-property!
  [repo block-ids key]
  (if (config/db-based-graph? repo)
    (db-property-handler/batch-remove-property! repo block-ids key)
    (file-property-handler/batch-remove-block-property! block-ids key)))

(defn batch-set-block-property!
  [repo block-ids key value]
  (if (config/db-based-graph? repo)
    (if (nil? value)
      (db-property-handler/batch-remove-property! repo block-ids key)
      (db-property-handler/batch-set-property! repo block-ids key value))
    (file-property-handler/batch-set-block-property! block-ids key value)))

(defn file-batch-set-property!
  [repo col]
  (when-not (config/db-based-graph? repo)
    (file-property-handler/batch-set-block-property-aux! col)))

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
          (= (:position schema) "block-beginning")))))

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
          (not= (keys properties) [(pu/get-built-in-property-uuid :icon)])))))

(defn property-create-new-block
  [block property value parse-block]
  (let [current-page-id (:block/uuid (or (:block/page block) block))
        page-name (str "$$$" current-page-id)
        page-entity (db/entity [:block/name page-name])
        page (or page-entity
                 (-> (block/page-name->map page-name true)
                     (assoc :block/type #{"hidden"}
                            :block/format :markdown
                            :block/metadata {:source-page-id current-page-id})))
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
                     :block/left [:block/uuid parent-id]}
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
                     (assoc :block/type #{"hidden"}
                            :block/format :markdown
                            :block/metadata {:source-page-id current-page-id})))
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

(defn upsert-enum-item
  "id should be a block UUID or nil"
  [property {:keys [id value icon description]}]
  (assert (or (nil? id) (uuid? id)))
  (when (= :enum (get-in property [:block/schema :type]))
    (let [icon-id (pu/get-pid "icon")
          value (if (string? value) (string/trim value) value)
          property-schema (:block/schema property)
          enum-config (:enum-config property-schema)
          enum-values (:values enum-config)
          enum-type (:type enum-config)
          block-values (map (fn [id] (db/entity [:block/uuid id])) enum-values)
          icon (when-not (and (string? icon) (string/blank? icon)) icon)
          description (string/trim description)
          description (when-not (string/blank? description) description)
          resolved-value (try
                           (db-property-handler/convert-property-input-string (or enum-type :default) value)
                           (catch :default e
                             (js/console.error e)
                             (notification/show! (str e) :error false)
                             nil))
          block (when id (db/entity [:block/uuid id]))
          value-block (when (uuid? value) (db/entity [:block/uuid value]))]
      (cond
        (and enum-type (nil? resolved-value))
        nil

        (some (fn [b] (and (= resolved-value (get-in b [:block/metadata :value]))
                           (not= id (:block/uuid b)))) block-values)
        (do
          (notification/show! "Choice already exists" :warning)
          :value-exists)

        (:block/name value-block)             ; page
        (let [new-values (vec (conj enum-values value))]
          {:block-id value
           :tx-data [{:db/id (:db/id property)
                      :block/schema (assoc-in property-schema [:enum-config :values] new-values)}]})

        :else
        (let [block-id (or id (db/new-block-id))
              tx-data (if block
                        [(let [properties (:block/properties block)
                               schema (assoc (:block/schema block)
                                             :value resolved-value)]
                           {:block/uuid id
                            :block/properties (if icon
                                                (assoc properties icon-id icon)
                                                (dissoc properties icon-id))
                            :block/schema (if description
                                            (assoc schema :description description)
                                            (dissoc schema :description))})]
                        (let [page-name (str "$$$" (:block/uuid property))
                              page-entity (db/entity [:block/name page-name])
                              page (or page-entity
                                       (-> (block/page-name->map page-name true)
                                           (assoc :block/type #{"hidden"}
                                                  :block/format :markdown)))
                              page-tx (when-not page-entity page)
                              page-id [:block/uuid (:block/uuid page)]
                              metadata {:created-from-property (:block/uuid property)}
                              new-block (cond->
                                         {:block/type #{"enum value"}
                                          :block/uuid block-id
                                          :block/page page-id
                                          :block/metadata metadata
                                          :block/schema {:value resolved-value}
                                          :block/parent page-id
                                          :block/left (or (when page-entity (model/get-block-last-direct-child (db/get-db) (:db/id page-entity)))
                                                          page-id)}
                                          icon
                                          (assoc :block/properties {icon-id icon})

                                          description
                                          (update :block/schema assoc :description description)

                                          true
                                          outliner-core/block-with-timestamps)
                              new-values (vec (conj enum-values block-id))]
                          (->> (cons page-tx [new-block
                                              {:db/id (:db/id property)
                                               :block/schema (assoc-in property-schema [:enum-config :values] new-values)}])
                               (remove nil?))))]
          {:block-id block-id
           :tx-data tx-data})))))

(defn delete-enum-item
  [property item]
  (if (seq (:block/_refs item))
    (notification/show! "The choice can't be deleted because it's still used." :warning)
    (let [schema (:block/schema property)
          tx-data [[:db/retractEntity (:db/id item)]
                   {:db/id (:db/id property)
                    :block/schema (update-in schema [:enum-config :values]
                                             (fn [values]
                                               (vec (remove #{(:block/uuid item)} values))))}]]
      (db/transact! tx-data))))

(defn get-property-block-created-block
  "Get the root block that created this property block."
  [eid]
  (let [b (db/entity eid)
        parents (model/get-block-parents (state/get-current-repo) (:block/uuid b) {})
        from-id (some #(get-in % [:block/metadata :created-from-block]) (reverse parents))
        from (when from-id (db/entity [:block/uuid from-id]))]
    (or (:db/id from) (:db/id b))))
