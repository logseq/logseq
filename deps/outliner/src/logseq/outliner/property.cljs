(ns logseq.outliner.property
  "Property related operations"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.validate :as outliner-validate]
            [malli.core :as m]
            [malli.error :as me]
            [malli.util :as mu]))

(defn- throw-error-if-read-only-property
  [property-ident]
  (when (db-property/read-only-properties property-ident)
    (throw (ex-info "Read-only property value shouldn't be edited"
                    {:property property-ident}))))

(defn- db-ident->eid
  [db db-ident]
  (assert (qualified-keyword? db-ident))
  (let [id (:db/id (d/entity db db-ident))]
    (when-not id
      (throw (ex-info "Wrong property db/ident" {:db-ident db-ident})))
    id))

(defonce ^:private built-in-class-property->properties
  (->>
   (mapcat
    (fn [[class-ident {:keys [properties]}]]
      (map
       (fn [property] [class-ident property])
       (cons :block/tags (keys properties))))
    db-class/built-in-classes)
   (concat
    (mapcat
     (fn [[property-ident {:keys [properties]}]]
       (map
        (fn [property] [property-ident property])
        (cons :block/tags (keys properties))))
     db-property/built-in-properties))
   set))

(defn- throw-error-if-deleting-protected-property
  [entity-idents property-ident]
  (when (some #(built-in-class-property->properties [% property-ident]) entity-idents)
    (throw (ex-info "Property is protected and can't be deleted"
                    {:type :notification
                     :payload {:type :error
                               :message "Property is protected and can't be deleted."
                               :i18n-key :property.validation/protected
                               :entity-idents entity-idents
                               :property property-ident}}))))

(defn- throw-error-if-removing-private-tag
  [entities]
  (when-let [private-tags
             (seq (set/intersection (set (mapcat #(map :db/ident (:block/tags %)) entities))
                                    ldb/private-tags))]
    (throw (ex-info "Can't remove private tags"
                    {:type :notification
                     :payload {:message (str "Can't remove private tags: " (string/join ", " private-tags) ".")
                               :i18n-key :class.validation/cant-remove-private-tags
                               :i18n-args [(string/join ", " private-tags)]
                               :type :error}
                     :property-id :block/tags}))))

(defn- throw-error-if-deleting-required-property
  [property-ident]
  (when (contains? db-malli-schema/required-properties property-ident)
    (throw (ex-info "Can't remove required property"
                    {:type :notification
                     :payload {:message "Can't remove required property."
                               :i18n-key :property.validation/cant-remove-required
                               :type :error}
                     :property-id property-ident}))))

(declare get-block-classes-properties)

(defn- validate-batch-deletion-of-property
  "Validates that the given property can be batch deleted from multiple nodes"
  [entities property-ident]
  (throw-error-if-deleting-protected-property (map :db/ident entities) property-ident)
  (when (= :block/tags property-ident) (throw-error-if-removing-private-tag entities))
  (outliner-validate/disallow-editing-private-built-in-nodes entities)
  (throw-error-if-deleting-required-property property-ident))

(defn- block-classes-provide-property?
  [db block property-id]
  (->> (:classes-properties (get-block-classes-properties db (:db/id block)))
       (some #(= property-id (:db/ident %)))
       boolean))

(defn- should-add-task-tag-for-property?
  [conn block property-id]
  (and (contains? #{:logseq.property/status :logseq.property/scheduled :logseq.property/deadline} property-id)
       (or (empty? (:block/tags block))
           (ldb/internal-page? block)
           (not (block-classes-provide-property? @conn block property-id)))))

(defn- class-lookup-ref?
  [value]
  ;; Class extends accepts only entity refs that can point at class blocks.
  ;; Keep this narrow to avoid per-value schema/entity lookups while parsing vectors.
  (and (vector? value)
       (= 2 (count value))
       (contains? #{:db/ident :block/uuid} (first value))))

(defn- single-entity-ref?
  [value]
  (or (de/entity? value)
      (integer? value)
      (keyword? value)
      (class-lookup-ref? value)))

(defn- ->entity-ids
  [db value]
  (letfn [(entity-id [item]
            (or (cond
                  (de/entity? item) (:db/id item)
                  (integer? item) item
                  (keyword? item) (:db/id (d/entity db item))
                  (class-lookup-ref? item) (:db/id (d/entity db item)))
                (throw (ex-info "Unsupported class extends entity reference"
                                {:value item}))))]
    (->> (cond
           (nil? value) []
           (single-entity-ref? value) [value]
           (coll? value) value
           :else [value])
         (map entity-id))))

(defn- class-ancestor-ids
  [db class-ids]
  (set (mapcat (fn [class-id]
                 (some->> (d/entity db class-id)
                          ldb/get-class-extends
                          (map :db/id)))
               class-ids)))

(defn- direct-extends-retraction-tx-data
  [class redundant-parent-ids]
  (when (and (ldb/class? class) (seq redundant-parent-ids))
    (keep (fn [parent]
            (when (contains? redundant-parent-ids (:db/id parent))
              [:db/retract (:db/id class) :logseq.property.class/extends (:db/id parent)]))
          (:logseq.property.class/extends class))))

(defn- canonical-extends-ids
  [db value]
  (let [parent-ids (vec (->entity-ids db value))]
    (remove (class-ancestor-ids db parent-ids) parent-ids)))

(defn- normalize-extends-value
  [db value]
  (let [ids (vec (canonical-extends-ids db value))]
    (if (single-entity-ref? value)
      (first ids)
      ids)))

(defn- redundant-extends-retraction-tx-data
  [db class value]
  (let [parent-ids (set (->entity-ids db value))
        ancestor-ids (class-ancestor-ids db parent-ids)
        inherited-parent-ids (set/union parent-ids ancestor-ids)]
    (concat
     (direct-extends-retraction-tx-data class ancestor-ids)
     (mapcat #(direct-extends-retraction-tx-data (d/entity db %) inherited-parent-ids)
             (db-class/get-structured-children db (:db/id class))))))

(defn- build-property-value-tx-data
  [conn block property-id value]
  (when (some? value)
    (let [old-value (get block property-id)
          property (d/entity @conn property-id)
          multiple-values? (= :db.cardinality/many (:db/cardinality property))
          retract-multiple-values? (and multiple-values? (sequential? value))
          multiple-values-empty? (and (sequential? old-value)
                                      (contains? (set (map :db/ident old-value)) :logseq.property/empty-placeholder))
          extends? (= property-id :logseq.property.class/extends)
          tx-value (if extends?
                     (let [value' (normalize-extends-value @conn value)]
                       (if (coll? value') (set value') value'))
                     value)
          update-block-tx (cond-> (outliner-core/block-with-updated-at {:db/id (:db/id block)})
                            true
                            (assoc property-id tx-value)
                            (should-add-task-tag-for-property? conn block property-id)
                            (assoc :block/tags :logseq.class/Task)
                            (= :logseq.property/template-applied-to property-id)
                            (assoc :block/tags :logseq.class/Template))]
      (cond-> []
        multiple-values-empty?
        (conj [:db/retract (:db/id update-block-tx) property-id :logseq.property/empty-placeholder])
        retract-multiple-values?
        (conj [:db/retract (:db/id update-block-tx) property-id])
        extends?
        (into (redundant-extends-retraction-tx-data @conn block value))
        true
        (conj update-block-tx)))))

(defn- get-property-value-schema
  "Gets a malli schema to validate the property value for the given property type and builds
   it with additional args like datascript db"
  [db property-type property & {:keys [new-closed-value?]
                                :or {new-closed-value? false}}]
  (let [property-val-schema (or (get db-property-type/built-in-validation-schemas property-type)
                                (throw (ex-info (str "No validation for property type " (pr-str property-type)) {})))
        [schema-opts schema-fn] (if (vector? property-val-schema)
                                  (rest property-val-schema)
                                  [{} property-val-schema])]
    [:fn
     schema-opts
     (fn property-value-schema [property-val]
       (db-malli-schema/validate-property-value db schema-fn [property property-val] {:new-closed-value? new-closed-value?}))]))

(defn- fail-parse-double
  [v-str]
  (let [result (parse-double v-str)]
    (or result
        (throw (ex-info (str "Can't convert \"" v-str "\" to a number")
                        {:type :notification
                         :payload {:message (str "Can't convert \"" v-str "\" to a number.")
                                   :i18n-key :property.validation/cant-convert-to-number
                                   :i18n-args [v-str]
                                   :type :error}})))))

(defn ^:api convert-property-input-string
  [block-type property v-str]
  (let [schema-type (:logseq.property/type property)]
    (if (and (or (= :number schema-type)
                 (and (= (:db/ident property) :logseq.property/default-value)
                      (= :number block-type)))
             (string? v-str))
      (fail-parse-double v-str)
      v-str)))

(defn- update-datascript-schema
  "Updates property type and cardinality"
  [property schema]
  (let [new-type (:logseq.property/type schema)
        cardinality (:db/cardinality schema)
        ident (:db/ident property)
        cardinality (if (#{:many :db.cardinality/many} cardinality)
                      :db.cardinality/many
                      :db.cardinality/one)
        old-type (:logseq.property/type property)
        old-ref-type? (db-property-type/user-ref-property-types old-type)
        ref-type? (db-property-type/user-ref-property-types new-type)]
    (cond-> [(cond->
              (outliner-core/block-with-updated-at
               {:db/ident ident
                :db/cardinality cardinality})
               ref-type?
               (assoc :db/valueType :db.type/ref))]
      (and new-type old-ref-type? (not ref-type?))
      (conj [:db/retract (:db/id property) :db/valueType]))))

(defn- validate-property-name-update
  [conn property property-name]
  (when (and (some? property-name) (not= property-name (:block/title property)))
    (outliner-validate/validate-page-title property-name {:node property})
    (outliner-validate/validate-page-title-characters property-name {:node property})
    (outliner-validate/validate-block-title @conn property-name property)
    (outliner-validate/validate-property-title property-name)))

(defn- update-property
  [conn db-ident property schema {:keys [property-name properties]}]
  (validate-property-name-update conn property property-name)
  (outliner-validate/validate-editing-built-in-property property schema)
  (let [changed-property-attrs
        ;; Only update property if something has changed as we are updating a timestamp
        (cond-> (->> (dissoc schema :db/cardinality)
                     (keep (fn [[k v]]
                             (when-not (= (get property k) v)
                               [k v])))
                     (into {}))
          (and (some? property-name) (not= property-name (:block/title property)))
          (assoc :block/title property-name
                 :block/name (common-util/page-name-sanity-lc property-name)))
        property-tx-data
        (cond-> []
          (seq changed-property-attrs)
          (conj (outliner-core/block-with-updated-at
                 (merge {:db/ident db-ident}
                        changed-property-attrs)))
          (and (seq schema)
               (or (not= (:logseq.property/type schema) (:logseq.property/type property))
                   (and (:db/cardinality schema) (not= (:db/cardinality schema) (keyword (name (:db/cardinality property)))))
                   (and (= :default (:logseq.property/type schema)) (not= :db.type/ref (:db/valueType property)))
                   (seq (entity-plus/lookup-kv-then-entity property :property/closed-values))))
          (concat (update-datascript-schema property schema)))
        tx-data (concat property-tx-data
                        (when (seq properties)
                          (mapcat
                           (fn [[property-id v]]
                             (build-property-value-tx-data conn property property-id v)) properties)))
        many->one? (and (db-property/many? property)
                        ;; For UI calls, :db/cardinality can have :one and :many values
                        (contains? #{:one :db.cardinality/one} (:db/cardinality schema)))]
    (when (and many->one? (seq (d/datoms @conn :avet db-ident)))
      (throw (ex-info "Disallowed many to one conversion"
                      {:type :notification
                       :payload {:message "This property can't change from multiple values to one value because it has existing data."
                                 :i18n-key :property.validation/many-to-one
                                 :type :warning}})))
    (when (and (contains? changed-property-attrs :logseq.property/type)
               (seq (d/datoms @conn :avet db-ident)))
      (throw (ex-info "Disallowed type change with existing data"
                      {:type :notification
                       :payload {:message "This property's type can't be changed because it has existing data."
                                 :type :error}})))
    (when (seq tx-data)
      (ldb/transact! conn tx-data {:outliner-op :update-property
                                   :property-id (:db/id property)}))
    property))

(defn- validate-property-value-aux
  [schema value {:keys [many?]}]
  ;; normalize :many values since most components update them as a single value
  (let [value' (if (and many? (not (sequential? value)))
                 #{value}
                 value)]
    (me/humanize (mu/explain-data schema value'))))

(defn validate-property-value
  [db property value]
  (let [property-type (:logseq.property/type property)
        many? (= :db.cardinality/many (:db/cardinality property))
        schema (get-property-value-schema db property-type property)]
    (validate-property-value-aux schema value {:many? many?})))

(defn- validate!
  "Validates `data` against `schema`.
   Throws an ex-info with readable message if validation fails."
  [property schema value]
  (when-not (and
             (= :db.type/ref (:db/valueType property))
             (= value :logseq.property/empty-placeholder))
    (when-not (m/validate schema value)
      (let [errors (-> (m/explain schema value)
                       (me/humanize))
            error-msg (str "Property validation failed: \"" (:block/title property) "\" " (if (coll? errors) (first errors) errors))]
        (throw
         (ex-info "Schema validation failed"
                  {:type :notification
                   :payload {:message error-msg
                             :i18n-key :property.validation/invalid-value
                             :i18n-args [(:block/title property) (if (coll? errors) (first errors) errors)]
                             :type :warning}
                   :property (:db/ident property)
                   :value value
                   :errors errors}))))))

(defn- throw-error-if-invalid-property-value
  [db property value]
  (let [property-type (:logseq.property/type property)
        many? (= :db.cardinality/many (:db/cardinality property))
        schema (get-property-value-schema db property-type property)
        value' (if (and many? (not (sequential? value)))
                 #{value}
                 value)]
    (validate! property schema value')))

(defn- throw-error-if-invalid-new-property-value
  [db property value]
  (let [property-type (:logseq.property/type property)
        many? (= :db.cardinality/many (:db/cardinality property))
        schema (get-property-value-schema db property-type property :new-closed-value? true)
        value' (if (and many? (not (or (sequential? value) (set? value))))
                 #{value}
                 value)]
    (validate! property schema value')))

(defn- ->eid
  [id]
  (if (uuid? id) [:block/uuid id] id))

(defn- raw-set-block-property!
  "Adds the raw property pair (value not modified) to the given block if the property value is valid"
  [conn block property new-value]
  (throw-error-if-read-only-property (:db/ident property))
  (throw-error-if-invalid-property-value @conn property new-value)
  (let [property-id (:db/ident property)
        tx-data (build-property-value-tx-data conn block property-id new-value)]
    (ldb/transact! conn tx-data {:outliner-op :save-block})))

(defn create-property-text-block!
  "Creates a property value block for the given property and value.

  Adds it to `block-id` unless `:set-block-property?` is false."
  [conn block-id property-id value {:keys [new-block-id set-block-property?]
                                    :or {set-block-property? true}}]
  (let [property (d/entity @conn property-id)
        block (when block-id (d/entity @conn block-id))
        _ (assert (some? property) (str "Property " property-id " doesn't exist yet"))
        value' (convert-property-input-string (:logseq.property/type block)
                                              property value)
        _ (when (and (not= (:logseq.property/type property) :number)
                     (not (string? value')))
            (throw (ex-info "value should be a string" {:block-id block-id
                                                        :property-id property-id
                                                        :value value'})))
        new-value-block (cond-> (db-property-build/build-property-value-block (or block property) property value')
                          new-block-id
                          (assoc :block/uuid new-block-id))]
    (ldb/batch-transact-with-temp-conn!
     conn
     {:outliner-op :create-property-text-block}
     (fn [conn]
       (ldb/transact! conn [new-value-block] {:outliner-op :insert-blocks})
       (let [property-id (:db/ident property)]
         (when (and property-id block set-block-property?)
           (when-let [block-id (:db/id (d/entity @conn [:block/uuid (:block/uuid new-value-block)]))]
             (raw-set-block-property! conn block property block-id))))))
    (:block/uuid new-value-block)))

(defn- get-property-value-eid
  [db property-id raw-value]
  (if (= property-id :block/tags)
    (first
     (d/q '[:find [?v ...]
            :in $ ?title
            :where
            [?v :block/title ?title]
            [?v :block/tags :logseq.class/Tag]]
          db
          raw-value))
    (first
     (d/q '[:find [?v ...]
            :in $ ?property-id ?raw-value
            :where
            [?b ?property-id ?v]
            (or [?v :block/title ?raw-value]
                [?v :logseq.property/value ?raw-value])]
          db
          property-id
          raw-value))))

(defn- find-or-create-property-value
  "Find or create a property value. Only to be used with properties that have ref types"
  [conn property-id v block-id]
  (let [property (d/entity @conn property-id)
        closed-values? (seq (entity-plus/lookup-kv-then-entity property :property/closed-values))
        default-or-url? (contains? #{:default :url} (:logseq.property/type property))]
    (cond
      closed-values?
      (some (fn [item]
              (when (or (= (:block/title item) v)
                        (= (:logseq.property/value item) v))
                (:db/id item))) (:block/_closed-value-property property))

      (and default-or-url?
           ;; FIXME: remove this when :logseq.property/order-list-type updated to closed values
           (not= property-id :logseq.property/order-list-type))
      (let [_ (throw-error-if-invalid-new-property-value @conn property v)
            v-uuid (create-property-text-block! conn block-id property-id v {:set-block-property? false})]
        (:db/id (d/entity @conn [:block/uuid v-uuid])))

      :else
      (or (get-property-value-eid @conn property-id v)
          (let [v-uuid (create-property-text-block! conn nil property-id v {})]
            (:db/id (d/entity @conn [:block/uuid v-uuid])))))))

(defn- convert-ref-property-value
  "Converts a ref property's value whether it's an integer or a string. Creates
   a property ref value for a string value if necessary"
  [conn property-id v property-type block-id]
  (let [number-property? (= property-type :number)]
    (cond
      (and (qualified-keyword? v) (not= :keyword property-type))
      (db-ident->eid @conn v)

      (and (coll? v)
           (every? integer? v)
           (not number-property?))
      v

      (and (integer? v)
           (or (not number-property?)
               ;; Allows :number property to use number as a ref (for closed value) or value
               (and number-property?
                    (= property-id (:db/ident (:logseq.property/created-from-property (d/entity @conn v)))))))
      v

      (= property-type :page)
      (let [error-data {:property-id property-id
                        :property-type property-type
                        :v v}]
        (if (or (string/blank? v) (not (string? v)))
          (throw (ex-info "Value should be non-empty string" error-data))
          (let [page (ldb/get-page @conn v)]
            (if (entity-util/page? page)
              (:db/id page)
              (let [[_ page-uuid] (outliner-page/create! conn v error-data)]
                (if-not page-uuid
                  (throw (ex-info "Failed to create page" {}))
                  (:db/id (d/entity @conn [:block/uuid page-uuid]))))))))

      :else
      ;; only value-ref-property types should call this
      (when-let [v' (if (and number-property? (string? v))
                      (parse-double v)
                      v)]
        (find-or-create-property-value conn property-id v' block-id)))))

(defn- convert-ref-property-values
  [conn property-id value property-type {:keys [many? block-id]}]
  (if-not (and many? (or (sequential? value) (set? value)))
    (convert-ref-property-value conn property-id value property-type block-id)
    (try
      (mapv #(convert-ref-property-value conn property-id % property-type block-id) value)
      (catch :default e
        (throw (ex-info "Failed to convert many property values"
                        (merge
                         {:property-id property-id
                          :property-type property-type
                          :value value
                          :many? many?
                          :value-shape (cond
                                         (vector? value) :vector
                                         (set? value) :set
                                         (sequential? value) :seq
                                         :else :single)}
                         (ex-data e))
                        e))))))

(defn- throw-error-if-self-value
  [block value ref?]
  (let [values (if (or (sequential? value) (set? value)) value [value])]
    (when (and ref?
               (some #(= % (:db/id block)) values))
      (throw (ex-info "Can't set this block itself as own property value"
                      {:type :notification
                       :payload {:message "Can't set this block itself as own property value."
                                 :i18n-key :property.validation/cant-set-self-value
                                 :type :error}})))))

(defn- remove-status!
  [conn block-ids {:keys [preserve-task-tag?]} tx-meta]
  (let [blocks (keep #(d/entity @conn (->eid %)) block-ids)
        task-properties (:logseq.property.class/properties
                         (d/entity @conn :logseq.class/Task))
        other-task-properties (disj (set (map :db/ident task-properties))
                                    :logseq.property/status)]
    (validate-batch-deletion-of-property blocks :logseq.property/status)
    (when (seq blocks)
      (let [txs (mapcat
                 (fn [block]
                   (let [status (:logseq.property/status block)
                         direct-status? (contains? (d/pull @conn
                                                           [:logseq.property/status]
                                                           (:db/id block))
                                                   :logseq.property/status)
                         empty-placeholder? (and direct-status?
                                                 (= :logseq.property/empty-placeholder
                                                    (:db/ident status)))
                         task? (some #(= :logseq.class/Task (:db/ident %))
                                     (:block/tags block))
                         status-provided? (or task?
                                              (block-classes-provide-property?
                                               @conn block :logseq.property/status))
                         remove-task? (and task?
                                           (not empty-placeholder?)
                                           (not preserve-task-tag?)
                                           (not-any? #(get block %) other-task-properties))]
                     (cond
                       empty-placeholder?
                       []

                       remove-task?
                       [[:db/retract (:db/id block) :logseq.property/status]
                        [:db/retract (:db/id block) :block/tags :logseq.class/Task]]

                       status-provided?
                       [{:db/id (:db/id block)
                         :logseq.property/status :logseq.property/empty-placeholder}]

                       direct-status?
                       [[:db/retract (:db/id block) :logseq.property/status]]

                       :else
                       [])))
                 blocks)]
        (ldb/transact! conn txs tx-meta)))))

(defn batch-remove-property!
  ([conn block-ids property-id]
   (batch-remove-property! conn block-ids property-id {}))
  ([conn block-ids property-id opts]
   (throw-error-if-read-only-property property-id)
   (if (= :logseq.property/status property-id)
     (remove-status! conn block-ids opts {:outliner-op :batch-remove-property})
    (let [block-eids (map ->eid block-ids)
        blocks (keep (fn [id] (d/entity @conn id)) block-eids)
        block-id-set (set (map :db/id blocks))]
    (validate-batch-deletion-of-property blocks property-id)
    (when (seq blocks)
      (when-let [property (d/entity @conn property-id)]
        (let [txs (mapcat
                   (fn [block]
                     (let [value (get block property-id)
                           entities (cond
                                      (de/entity? value) [value]
                                      (and (sequential? value) (every? de/entity? value)) value
                                      :else nil)
                           deleting-entities (filter
                                              (fn [value]
                                                (let [value-referrers*
                                                      (d/q '[:find [?e ...]
                                                             :in $ ?property-id ?value-id
                                                             :where
                                                             [?e ?property-id ?value-id]]
                                                           @conn
                                                           (:db/ident property)
                                                           (:db/id value))
                                                      value-referrers
                                                      (cond
                                                        (nil? value-referrers*)
                                                        #{}

                                                        (coll? value-referrers*)
                                                        (set value-referrers*)

                                                        :else
                                                        #{value-referrers*})]
                                                  (and
                                                   (:logseq.property/created-from-property value)
                                                   (not (or (entity-util/page? value) (ldb/closed-value? value)))
                                                   (empty? (set/difference value-referrers block-id-set)))))
                                              entities)
                           retract-blocks-tx (when (seq deleting-entities)
                                               (:tx-data (outliner-core/delete-blocks @conn deleting-entities {})))]
                       (concat
                        [[:db/retract (:db/id block) (:db/ident property)]]
                        retract-blocks-tx)))
                   blocks)]
          (when (seq txs)
            (ldb/transact! conn txs
                           {:outliner-op :batch-remove-property})))))))))

(defn- validate-batch-set-property
  [conn block-eids property-id v]
  (outliner-validate/disallow-editing-private-built-in-nodes (mapv #(d/entity @conn %) block-eids))
  (when (= property-id :block/tags)
    (outliner-validate/validate-tags-property @conn block-eids v))
  (when (= property-id :logseq.property.class/extends)
    (doseq [parent-id (->entity-ids @conn v)]
      (outliner-validate/validate-extends-property
       @conn
       (d/entity @conn parent-id)
       (map #(d/entity @conn %) block-eids)))))

(defn- normalize-default-url-property-value
  [conn property value]
  (if (number? value)
    (do
      (throw-error-if-invalid-property-value @conn property value)
      (:block/title (d/entity @conn value)))
    value))

(defn- normalize-and-validate-default-url-property-value
  [conn property value]
  (let [value' (normalize-default-url-property-value conn property value)]
    (when-not (qualified-keyword? value')
      (throw-error-if-invalid-new-property-value @conn property value'))
    value'))

(defn- normalize-and-validate-default-url-property-values
  [conn property value many?]
  (if (and many? (or (sequential? value) (set? value)))
    (mapv #(normalize-and-validate-default-url-property-value conn property %) value)
    (normalize-and-validate-default-url-property-value conn property value)))

(defn- throw-error-if-invalid-alias
  "Validate alias ownership invariants when adding a :block/alias value."
  [db source-block alias-id]
  (when (= alias-id (:db/id source-block))
    (throw (ex-info "Alias can't be the page itself"
                    {:type :notification
                     :payload {:type :error
                               :i18n-key :page.validation/alias-self
                               :message "Alias can't be the page itself."}})))
  (let [alias-entity (d/entity db alias-id)]
    (when-let [existing-owner (first (:block/_alias alias-entity))]
      (when (not= (:db/id existing-owner) (:db/id source-block))
        (throw (ex-info "Page is already an alias of another page"
                        {:type :notification
                         :payload {:type :error
                                   :i18n-key :page.validation/alias-duplicate-owner
                                   :message "This page is already an alias of another page."}}))))
    (when (seq (:block/alias alias-entity))
      (throw (ex-info "A page that has aliases can't be used as an alias"
                      {:type :notification
                       :payload {:type :error
                                 :i18n-key :page.validation/alias-owns-aliases
                                 :message "A page that has aliases can't be used as an alias."}}))))
  (when (seq (:block/_alias (d/entity db (:db/id source-block))))
    (throw (ex-info "A page that is an alias of another page can't have its own aliases"
                    {:type :notification
                     :payload {:type :error
                               :i18n-key :page.validation/alias-source-is-alias
                               :message "A page that is an alias of another page can't have its own aliases."}}))))

(defn- throw-error-if-batch-alias-targets
  [block-eids property-id]
  (when (and (= property-id :block/alias)
             (> (count block-eids) 1))
    (throw (ex-info "Aliases can't be batch-set on multiple pages"
                    {:type :notification
                     :payload {:type :error
                               :i18n-key :page.validation/alias-batch-multiple-owners
                               :message "Aliases can't be batch-set on multiple pages."}}))))

(defn ^:large-vars/cleanup-todo batch-set-property!
  "Sets properties for multiple blocks. Automatically handles property value refs.
   Does no validation of property values. For :many properties, passing a collection
   replaces existing values in one call, while passing a scalar preserves add-single-value behavior."
  ([conn block-ids property-id v]
   (batch-set-property! conn block-ids property-id v {}))
  ([conn block-ids property-id v options]
   (assert property-id "property-id is nil")
   (throw-error-if-read-only-property property-id)
   (if (nil? v)
     (batch-remove-property! conn block-ids property-id options)
     (let [block-eids (map ->eid block-ids)
           _ (throw-error-if-batch-alias-targets block-eids property-id)
           _ (validate-batch-set-property conn block-eids property-id v)
           property (d/entity @conn property-id)
           _ (when (nil? property)
               (throw (ex-info (str "Property " property-id " doesn't exist yet") {:property-id property-id})))
           property-type (get property :logseq.property/type :default)
           many? (= :db.cardinality/many (:db/cardinality property))
           entity-id? (and (:entity-id? options) (number? v))
           ref? (contains? db-property-type/all-ref-property-types property-type)
           extends? (= property-id :logseq.property.class/extends)
           default-url-not-closed? (and (contains? #{:default :url} property-type)
                                        (not extends?)
                                        (not (seq (entity-plus/lookup-kv-then-entity property :property/closed-values))))
           v' (cond
                extends?
                (normalize-extends-value @conn v)

                (and ref? (not entity-id?))
                (if default-url-not-closed?
                  (normalize-and-validate-default-url-property-values conn property v many?)
                  (convert-ref-property-values conn property-id v property-type {:many? many?}))

                :else
                v)
           _ (when (nil? v')
               (throw (ex-info "Property value must be not nil" {:v v})))
           txs (doall
                (mapcat
                 (fn [eid]
                   (if-let [block (d/entity @conn eid)]
                     (let [v' (if (and default-url-not-closed?
                                       (not (and (keyword? v) entity-id?)))
                                (convert-ref-property-values conn property-id v' property-type
                                                             {:many? many?
                                                              :block-id (:db/id block)})
                                v')]
                       (throw-error-if-self-value block v' ref?)
                       (throw-error-if-invalid-property-value @conn property v')
                       (when (= property-id :block/alias)
                         (doseq [alias-id (if (coll? v') v' [v'])]
                           (when (number? alias-id)
                             (throw-error-if-invalid-alias @conn block alias-id))))
                       (build-property-value-tx-data conn block property-id v'))
                     (js/console.error "Skipping setting a block's property because the block id could not be found:" eid)))
                 block-eids))]
       (when (seq txs)
         (ldb/transact! conn txs {:outliner-op :batch-set-property}))))))

(defn remove-block-property!
  [conn eid property-id]
  (throw-error-if-read-only-property property-id)
  (let [eid (->eid eid)
        block (d/entity @conn eid)
        property (d/entity @conn property-id)
        tx-meta {:outliner-op :remove-block-property}]
    (when-not (contains? #{:logseq.property.class/extends :logseq.property/status} property-id)
      (validate-batch-deletion-of-property [block] property-id))
    (when block
      (cond
        (= :logseq.property/empty-placeholder (:db/ident (get block property-id)))
        nil

        (= :logseq.property/status property-id)
        (remove-status! conn [eid] {} tx-meta)

        (and (:logseq.property/default-value property)
             (= (:logseq.property/default-value property) (get block property-id)))
        (ldb/transact! conn
                       [{:db/id (:db/id block)
                         property-id :logseq.property/empty-placeholder}]
                       tx-meta)

        (and (ldb/class? block) (= property-id :logseq.property.class/extends))
        (ldb/transact! conn
                       [[:db/retract (:db/id block) :logseq.property.class/extends]
                        [:db/add (:db/id block) :logseq.property.class/extends :logseq.class/Root]]
                       tx-meta)

        (contains? db-property/db-attribute-properties property-id)
        (ldb/transact! conn
                       [[:db/retract (:db/id block) property-id]]
                       tx-meta)

        :else
        (batch-remove-property! conn [eid] property-id)))))

(defn- set-block-db-attribute!
  [conn block property property-id raw-v tx-v]
  (let [validation-db @conn
        validation-v (if (and (= :db.type/ref (:db/valueType property))
                              (some? tx-v))
                       tx-v
                       raw-v)]
    (throw-error-if-invalid-property-value validation-db property validation-v)
    (when (= property-id :block/alias)
      (doseq [alias-id (if (coll? tx-v) tx-v [tx-v])]
        (throw-error-if-invalid-alias validation-db block alias-id)))
    (let [tx-data (cond->
                   [{:db/id (:db/id block) property-id tx-v}]
                    (= property-id :logseq.property.class/extends)
                    (conj [:db/retract (:db/id block) :logseq.property.class/extends :logseq.class/Root]))]
      (ldb/transact! conn tx-data
                     {:outliner-op :save-block}))))

(defn ^:large-vars/cleanup-todo set-block-property!
  "Updates a block property's value for an existing property-id and block.  If
  property is a ref type, automatically handles a raw property value i.e. you
  can pass \"value\" instead of the property value entity. Also handle db
  attributes as properties"
  [conn block-eid property-id v]
  (ldb/batch-transact-with-temp-conn!
   conn
   {:outliner-op :set-block-property}
   (fn [conn]
     (throw-error-if-read-only-property property-id)
     (let [block-eid (->eid block-eid)
           _ (assert (qualified-keyword? property-id) "property-id should be a keyword")
           block (d/entity @conn block-eid)
           db-attribute? (some? (db-schema/schema property-id))
           property (d/entity @conn property-id)
           property-type (get property :logseq.property/type :default)
           ref? (db-property-type/all-ref-property-types property-type)
           extends? (= property-id :logseq.property.class/extends)
           v' (cond
                extends?
                (normalize-extends-value @conn v)

                ref?
                (convert-ref-property-value conn property-id v property-type block-eid)

                :else
                v)]
       (when-not (and block property)
         (throw (ex-info "Set block property failed: block or property doesn't exist"
                         {:block-eid block-eid
                          :property-id property-id
                          :block block
                          :property property})))
       (if (nil? v')
         (remove-block-property! conn block-eid property-id)
         (do
           (when (= property-id :block/tags)
             (outliner-validate/validate-tags-property @conn [block-eid] v'))
           (when extends?
             (doseq [parent-id (->entity-ids @conn v')]
               (outliner-validate/validate-extends-property @conn (d/entity @conn parent-id) [block])))
           (cond
             db-attribute?
             (set-block-db-attribute! conn block property property-id v v')

             :else
             (let [_ (assert (some? property) (str "Property " property-id " doesn't exist yet"))
                   ref? (db-property-type/all-ref-property-types property-type)
                   existing-value (get block property-id)
                   many? (= :db.cardinality/many (:db/cardinality property))
                   many-ref-value-ids (fn [value]
                                        (->> (cond
                                               (nil? value) []
                                               (de/entity? value) [value]
                                               (sequential? value) value
                                               :else [value])
                                             (map (fn [item]
                                                    (if (de/entity? item)
                                                      (:db/id item)
                                                      item)))
                                             set))
                   value-matches? (if ref?
                                    (if (and many? (coll? v'))
                                      (= (many-ref-value-ids existing-value)
                                         (many-ref-value-ids v'))
                                      (= existing-value v'))
                                    (= existing-value v'))]
               (throw-error-if-self-value block v' ref?)
               (when-not value-matches?
                 (raw-set-block-property! conn block property v'))))))))))

(defn upsert-property!
  "Updates property if property-id is given. Otherwise creates a property
    with the given property-id or :property-name option. When a property is created
    it is ensured to have a unique :db/ident"
  [conn property-id schema {:keys [property-name properties] :as opts}]
  (let [db @conn
        db-ident (or property-id
                     (try (db-property/create-user-property-ident-from-name property-name)
                          (catch :default e
                            (throw (ex-info (str e)
                                            {:type :notification
                                             :payload {:message "Property failed to create. Please try a different property name."
                                                       :i18n-key :property/create-error
                                                       :type :error}})))))]
    (assert (qualified-keyword? db-ident))
    (when (and (contains? #{:checkbox} (:logseq.property/type schema))
               (= :db.cardinality/many (:db/cardinality schema)))
      (throw (ex-info ":checkbox property doesn't allow multiple values"
                      {:property-id property-id
                       :schema schema})))
    (if-let [property (and (qualified-keyword? property-id) (d/entity db db-ident))]
      (update-property conn db-ident property schema opts)
      (let [k-name (or (and property-name (name property-name))
                       (name property-id))
            db-ident' (db-ident/ensure-unique-db-ident @conn db-ident)]
        (assert (some? k-name)
                (prn "property-id: " property-id ", property-name: " property-name))
        (outliner-validate/validate-page-title k-name {:node {:db/ident db-ident'}})
        (outliner-validate/validate-page-title-characters k-name {:node {:db/ident db-ident'}})
        (outliner-validate/validate-property-title k-name {:node {:db/ident db-ident'}})
        (let [db-id (:db/id properties)
              opts' (cond-> {:title k-name
                             :properties properties}
                      (integer? db-id)
                      (assoc :block-uuid (:block/uuid (d/entity db db-id))))
              tx-data (concat
                       [(sqlite-util/build-new-property db-ident' schema opts')]
                       ;; Convert page to property
                       (when db-id
                         [[:db/retract db-id :block/tags :logseq.class/Page]]))]
          (ldb/transact! conn tx-data
                         {:outliner-op :upsert-property}))
        (d/entity @conn db-ident')))))

(defn batch-delete-property-value!
  "batch delete value when a property has multiple values"
  [conn block-eids property-id property-value]
  (let [block-eids (map ->eid block-eids)]
    (ldb/batch-transact-with-temp-conn!
     conn
     {:outliner-op :batch-delete-property-value}
     (fn [conn]
       (when-let [property (d/entity @conn property-id)]
         (when (and (db-property/many? property)
                    (not (some #(= property-id (:db/ident (d/entity @conn %))) block-eids)))
           (when (= property-id :block/tags)
             (outliner-validate/validate-tags-property-deletion @conn block-eids property-value))
           (if (= property-id :block/tags)
             (let [tx-data (map (fn [id] [:db/retract id property-id property-value]) block-eids)]
               (ldb/transact! conn tx-data {:outliner-op :save-block}))
             (doseq [block-eid block-eids]
               (when-let [block (d/entity @conn block-eid)]
                 (let [current-val (get block property-id)
                       fv (first current-val)]
                   (if (and (= 1 (count current-val))
                            (or (= property-value fv)
                                (= property-value (:db/id fv))))
                     (remove-block-property! conn (:db/id block) property-id)
                     (ldb/transact! conn
                                    [[:db/retract (:db/id block) property-id property-value]]
                                    {:outliner-op :save-block}))))))))))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [conn block-eid property-id property-value]
  (batch-delete-property-value! conn [block-eid] property-id property-value))

(defn ^:api get-classes-parents
  [tags]
  (ldb/get-classes-parents tags))

(defn ^:api get-class-properties
  [class]
  (let [class-parents (get-classes-parents [class])]
    (->> (mapcat (fn [class]
                   (:logseq.property.class/properties class)) (concat [class] class-parents))
         (common-util/distinct-by :db/id)
         (ldb/sort-by-order))))

(defn ^:api get-block-classes
  [db eid]
  (let [block (d/entity db eid)
        classes (->> (:block/tags block)
                     (sort-by :block/name)
                     (filter ldb/class?))
        class-parents (get-classes-parents classes)]
    (->> (concat classes class-parents)
         (filter (fn [class]
                   (seq (:logseq.property.class/properties class)))))))

(defn ^:api get-block-classes-properties
  [db eid]
  (let [block (d/entity db eid)
        classes (->> (:block/tags block)
                     (sort-by :block/name))
        class-parents (get-classes-parents classes)
        all-classes (->> (concat classes class-parents)
                         (filter (fn [class]
                                   (seq (:logseq.property.class/properties class)))))
        all-properties (-> (mapcat (fn [class]
                                     (:logseq.property.class/properties class)) all-classes)
                           distinct)]
    {:classes classes
     :all-classes all-classes           ; block own classes + parent classes
     :classes-properties all-properties}))

(defn ^:api get-block-full-properties
  "Get block's full properties including its own and classes' properties"
  [db eid]
  (let [block (d/entity db eid)]
    (->>
     (concat
      (map (fn [ident] (d/entity db ident)) (keys (entity-plus/lookup-kv-then-entity block :block/properties)))
      (:classes-properties (get-block-classes-properties db eid)))
     (common-util/distinct-by :db/id))))

(defn- schema-or-tag-related-property?
  [property-id]
  (let [property-ns (some-> property-id namespace)]
    (or (= :block/tags property-id)
        (= "logseq.property.class" property-ns)
        (contains? db-property/schema-properties property-id))))

(defn- tag-class-page?
  [db block]
  (or (= :logseq.class/Tag (:db/ident block))
      (and db
           (ldb/class-instance? (entity-plus/entity-memoized db :logseq.class/Tag) block))))

(defn- bottom-position-property?
  [_db _block property]
  (let [property-id (:db/ident property)
        property-type (:logseq.property/type property)
        node-many? (and (= :node property-type)
                        (= :db.cardinality/many (:db/cardinality property)))
        default-bottom? (and (not (contains? #{:url :asset} property-type))
                             (or node-many?
                                 (not= :default property-type)
                                 (seq (:property/closed-values property)))
                             (not (schema-or-tag-related-property? property-id)))]
    default-bottom?))

(defn- resolved-property-position
  [db block property]
  (let [ui-position (:logseq.property/ui-position property)]
    (cond
      (contains? #{:properties :block-left :block-right :block-below} ui-position)
      ui-position

      (bottom-position-property? db block property)
      :block-below

      :else
      :properties)))

(defn- property-with-position?
  [db property-id block position {:keys [allow-empty-block-below?]}]
  (when-let [property (entity-plus/entity-memoized db property-id)]
    (let [property-position' (resolved-property-position db block property)]
      (and
       (not (false? (:logseq.property/public? property)))
       (= property-position' position)
       (not (and (:logseq.property/hide-empty-value property)
                 (nil? (get block property-id))))
       (not (:logseq.property/hide? property))
       (not (and
             (= property-position' :block-below)
             (nil? (get block property-id))
             (not allow-empty-block-below?)
             (not (tag-class-page? db block))))))))

(defn property-with-other-position?
  [db block property]
  (not= :properties (resolved-property-position db block property)))

(defn get-block-positioned-properties
  [db eid position]
  (let [block (d/entity db eid)
        own-properties (:block.temp/property-keys block)
        classes-properties (when-not (tag-class-page? db block)
                             (:classes-properties (get-block-classes-properties db eid)))
        classes-properties-set (set (map :db/ident classes-properties))
        positioned-property-ids (if (tag-class-page? db block)
                                  (distinct own-properties)
                                  (->> classes-properties
                                       (map :db/ident)
                                       (concat own-properties)
                                       distinct))]
    (->> positioned-property-ids
         (filter (fn [id]
                   (property-with-position? db id block position
                                            {:allow-empty-block-below?
                                             (contains? classes-properties-set id)})))
         (map #(d/entity db %))
         (ldb/sort-by-order))))

(defn- build-closed-value-tx
  [db property resolved-value {:keys [id icon scoped-class-id]}]
  (let [block (when id (d/entity db [:block/uuid id]))
        block-id (or id (ldb/new-block-id))
        icon (when-not (and (string? icon) (string/blank? icon)) icon)
        tx-data (if block
                  [(cond->
                    (outliner-core/block-with-updated-at
                     (merge
                      {:block/uuid id
                       :block/closed-value-property (:db/id property)}
                      (if (db-property-type/property-value-content? (:logseq.property/type block) property)
                        {:logseq.property/value resolved-value}
                        {:block/title resolved-value})))
                     icon
                     (assoc :logseq.property/icon icon))]
                  (let [max-order (:block/order (last (entity-plus/lookup-kv-then-entity property :property/closed-values)))
                        new-block (-> (db-property-build/build-closed-value-block block-id nil resolved-value
                                                                                  property {:icon icon})
                                      (assoc :block/order (db-order/gen-key max-order nil)))]
                    [new-block
                     (outliner-core/block-with-updated-at
                      {:db/id (:db/id property)})]))
        tx-data' (if (and (:db/id block) (nil? icon))
                   (conj tx-data [:db/retract (:db/id block) :logseq.property/icon])
                   tx-data)]
    (cond-> (vec tx-data')
      scoped-class-id
      (conj [:db/add [:block/uuid block-id] :logseq.property/choice-classes scoped-class-id]))))

(defn upsert-closed-value!
  "id should be a block UUID or nil"
  [conn property-id {:keys [id value description _scoped-class-id] :as opts}]
  (assert (or (nil? id) (uuid? id)))
  (let [db @conn
        property (d/entity db property-id)
        property-type (:logseq.property/type property)]
    (when (contains? db-property-type/closed-value-property-types property-type)
      (let [value' (if (string? value) (string/trim value) value)
            resolved-value (convert-property-input-string nil property value')
            validate-message (validate-property-value-aux
                              (get-property-value-schema @conn property-type property {:new-closed-value? true})
                              resolved-value
                              {:many? (db-property/many? property)})]
        (cond
          (some (fn [b]
                  (and (= (str resolved-value) (str (or (db-property/closed-value-content b)
                                                        (:block/uuid b))))
                       (not= id (:block/uuid b))))
                (entity-plus/lookup-kv-then-entity property :property/closed-values))
          (throw (ex-info "Closed value choice already exists"
                          {:error :value-exists
                           :type :notification
                           :payload {:message "Choice already exists."
                                     :i18n-key :property.choice/already-exists
                                     :type :warning}}))

          validate-message
          (throw (ex-info "Invalid property value"
                          {:error :value-invalid
                           :type :notification
                           :payload {:message (str "Invalid choice \"" value' "\" for this property: " validate-message ".")
                                     :i18n-key :property.choice/invalid
                                     :i18n-args [value' validate-message]
                                     :type :warning}}))

          (nil? resolved-value)
          nil

          :else
          (let [tx-data (build-closed-value-tx @conn property resolved-value opts)]
            (ldb/batch-transact-with-temp-conn!
             conn
             {:outliner-op :upsert-closed-value}
             (fn [conn]
               (ldb/transact! conn tx-data)
               (when (seq description)
                 (if-let [desc-ent (and id (:logseq.property/description (d/entity db [:block/uuid id])))]
                   (ldb/transact! conn
                                  [(outliner-core/block-with-updated-at {:db/id (:db/id desc-ent)
                                                                         :block/title description})])
                   (set-block-property! conn
                                        [:block/uuid (or id (:block/uuid (first tx-data)))]
                                        :logseq.property/description
                                        description)))))))))))

(defn add-existing-values-to-closed-values!
  "Adds existing values as closed values and returns their new block uuids"
  [conn property-id values]
  (when-let [property (d/entity @conn property-id)]
    (when (seq values)
      (let [values' (remove string/blank? values)]
        (assert (every? uuid? values') "existing values should all be UUIDs")
        (let [values (keep #(d/entity @conn [:block/uuid %]) values')]
          (when (seq values)
            (let [property-db-id (:db/id property)
                  value-property-tx (map (fn [id]
                                           {:db/id id
                                            :block/closed-value-property property-db-id
                                            :block/parent property-db-id
                                            :block/page property-db-id})
                                         (map :db/id values))
                  property-tx (outliner-core/block-with-updated-at {:db/id property-db-id})]
              (ldb/transact! conn (cons property-tx value-property-tx)
                             {:outliner-op :add-existing-values-to-closed-values}))))))))

(defn delete-closed-value!
  "Returns true when deleted or if not deleted displays warning and returns false"
  [conn property-id value-block-id]
  (when (or (nil? property-id)
            (nil? value-block-id))
    (throw (ex-info "empty property-id or value-block-id when delete-closed-value!"
                    {:property-id property-id
                     :value-block-id value-block-id})))
  (let [property (d/entity @conn property-id)]
    (when-not (ldb/property? property)
      (throw (ex-info "Invalid property" {:property-id property-id})))
    (when-let [value-block (d/entity @conn value-block-id)]
      (if (ldb/built-in? value-block)
        (throw (ex-info "The choice can't be deleted"
                        {:type :notification
                         :payload {:message "The choice can't be deleted because it's built-in."
                                   :i18n-key :property.choice/cant-delete-built-in
                                   :type :warning}}))
        (let [tx-data (conj (:tx-data (outliner-core/delete-blocks @conn [value-block] {}))
                            (outliner-core/block-with-updated-at {:db/id (:db/id property)}))]
          (ldb/transact! conn tx-data
                         {:outliner-op :delete-closed-value}))))))

(defn class-add-property!
  [conn class-id property-id]
  (when-not (contains? #{:logseq.property/empty-placeholder} property-id)
    (when-let [class (d/entity @conn class-id)]
      (if (ldb/class? class)
        (when-let [property (d/entity @conn property-id)]
          (when (ldb/property? property)
            (ldb/transact! conn
                           [[:db/add (:db/id class) :logseq.property.class/properties property-id]]
                           {:outliner-op :class-add-property})))
        (throw (ex-info "Can't add a property to a block that isn't a class"
                        {:class-id class-id :property-id property-id}))))))

(defn class-remove-property!
  [conn class-id property-id]
  (when-let [class (d/entity @conn class-id)]
    (when (ldb/class? class)
      (when-let [property (d/entity @conn property-id)]
        (when (ldb/property? property)
          (when-not (ldb/built-in-class-property? class property)
            (ldb/transact! conn
                           [[:db/retract (:db/id class) :logseq.property.class/properties property-id]]
                           {:outliner-op :class-remove-property})))))))
