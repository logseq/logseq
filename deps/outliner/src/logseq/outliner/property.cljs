(ns logseq.outliner.property
  "Property related operations"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [malli.error :as me]
            [malli.util :as mu]
            [clojure.set :as set]))

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(defn- build-property-value-tx-data
  ([block property-id value]
   (build-property-value-tx-data block property-id value (= property-id :logseq.task/status)))
  ([block property-id value status?]
   (when (some? value)
     (let [old-value (get block property-id)
           multiple-values-empty? (and (coll? old-value)
                                       (= 1 (count old-value))
                                       (= :logseq.property/empty-placeholder (:db/ident (first old-value))))
           block (assoc (outliner-core/block-with-updated-at {:db/id (:db/id block)})
                        property-id value)
           block-tx-data (cond-> block
                           status?
                           (assoc :block/tags :logseq.class/Task))]
       [(when multiple-values-empty?
          [:db/retract (:db/id block) property-id :logseq.property/empty-placeholder])
        block-tx-data]))))


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
                         :payload {:message (str "Can't convert \"" v-str "\" to a number")
                                   :type :error}})))))

(defn ^:api convert-property-input-string
  [schema-type v-str]
  (if (and (= :number schema-type) (string? v-str))
    (fail-parse-double v-str)
    v-str))

(defn- update-datascript-schema
  [property {:keys [type cardinality]}]
  (let [ident (:db/ident property)
        cardinality (if (= cardinality :many) :db.cardinality/many :db.cardinality/one)
        old-type (get-in property [:block/schema :type])
        old-ref-type? (db-property-type/ref-property-types old-type)
        ref-type? (db-property-type/ref-property-types type)]
    [(cond->
      {:db/ident ident
       :db/cardinality cardinality}
       ref-type?
       (assoc :db/valueType :db.type/ref))
     (when (and old-ref-type? (not ref-type?))
       [:db/retract (:db/id property) :db/valueType])]))

(defn- update-property
  [conn db-ident property schema {:keys [property-name properties]}]
  (let [changed-property-attrs
        ;; Only update property if something has changed as we are updating a timestamp
        (cond-> {}
          (not= schema (:block/schema property))
          (assoc :block/schema schema)
          (and (some? property-name) (not= property-name (:block/title property)))
          (assoc :block/title property-name
                 :block/name (common-util/page-name-sanity-lc property-name)))
        property-tx-data
        (cond-> []
          (seq changed-property-attrs)
          (conj (outliner-core/block-with-updated-at
                 (merge {:db/ident db-ident}
                        (common-util/dissoc-in changed-property-attrs [:block/schema :cardinality]))))
          (or (not= (:type schema) (get-in property [:block/schema :type]))
              (and (:cardinality schema) (not= (:cardinality schema) (keyword (name (:db/cardinality property)))))
              (and (= :default (:type schema)) (not= :db.type/ref (:db/valueType property)))
              (seq (:property/closed-values property)))
          (concat (update-datascript-schema property schema)))
        tx-data (concat property-tx-data
                        (when (seq properties)
                          (mapcat
                           (fn [[property-id v]]
                             (build-property-value-tx-data property property-id v)) properties)))
        many->one? (and (db-property/many? property) (= :one (:cardinality schema)))]
    (when (and many->one? (seq (d/datoms @conn :avet db-ident)))
      (throw (ex-info "Disallowed many to one conversion"
                      {:type :notification
                       :payload {:message "This property can't change from multiple values to one value because it has existing data."
                                 :type :warning}})))
    (when (seq tx-data)
      (ldb/transact! conn tx-data {:outliner-op :update-property
                                   :property-id (:db/id property)}))
    property))

(defn upsert-property!
  "Updates property if property-id is given. Otherwise creates a property
   with the given property-id or :property-name option. When a property is created
   it is ensured to have a unique :db/ident"
  [conn property-id schema {:keys [property-name] :as opts}]
  (let [db @conn
        db-ident (or property-id
                     (try (db-property/create-user-property-ident-from-name property-name)
                          (catch :default e
                            (throw (ex-info (str e)
                                            {:type :notification
                                             :payload {:message "Property failed to create. Please try a different property name."
                                                       :type :error}})))))]
    (assert (qualified-keyword? db-ident))
    (if-let [property (and (qualified-keyword? property-id) (d/entity db db-ident))]
      (update-property conn db-ident property schema opts)
      (let [k-name (or (and property-name (name property-name))
                       (name property-id))
            db-ident' (db-ident/ensure-unique-db-ident @conn db-ident)]
        (assert (some? k-name)
                (prn "property-id: " property-id ", property-name: " property-name))
        (ldb/transact! conn
                       [(sqlite-util/build-new-property db-ident' schema {:title k-name})]
                       {:outliner-op :new-property})
        (d/entity @conn db-ident')))))

(defn- validate-property-value
  [schema value]
  (me/humanize (mu/explain-data schema value)))

(defn- ->eid
  [id]
  (if (uuid? id) [:block/uuid id] id))

(defn- raw-set-block-property!
  "Adds the raw property pair (value not modified) to the given block if the property value is valid"
  [conn block property property-type new-value]
  (let [k-name (:block/title property)
        property-id (:db/ident property)
        schema (get-property-value-schema @conn property-type property)]
    (if-let [msg (and
                  (not= new-value :logseq.property/empty-placeholder)
                  (validate-property-value schema
                                           ;; normalize :many values for components that only provide single value
                                           (if (and (db-property/many? property) (not (coll? new-value)))
                                             #{new-value}
                                             new-value)))]
      (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
        (throw (ex-info "Schema validation failed"
                        {:type :notification
                         :payload {:message msg'
                                   :type :warning}})))
      (let [status? (= :logseq.task/status (:db/ident property))
            tx-data (build-property-value-tx-data block property-id new-value status?)]
        (ldb/transact! conn tx-data {:outliner-op :save-block})))))

(defn create-property-text-block!
  "Creates a property value block for the given property and value. Adds it to
  block if given block."
  [conn block-id property-id value {:keys [new-block-id]}]
  (let [property (d/entity @conn property-id)
        block (when block-id (d/entity @conn block-id))
        _ (assert (some? property) (str "Property " property-id " doesn't exist yet"))
        value' (convert-property-input-string (get-in property [:block/schema :type]) value)
        new-value-block (cond-> (db-property-build/build-property-value-block (or block property) property value')
                          new-block-id
                          (assoc :block/uuid new-block-id))]
    (ldb/transact! conn [new-value-block] {:outliner-op :insert-blocks})
    (let [property-id (:db/ident property)]
      (when (and property-id block)
        (when-let [block-id (:db/id (d/entity @conn [:block/uuid (:block/uuid new-value-block)]))]
          (raw-set-block-property! conn block property (get-in property [:block/schema :type]) block-id)))
      (:block/uuid new-value-block))))

(defn- get-property-value-eid
  [db property-id raw-value]
  (first
   (d/q '[:find [?v ...]
          :in $ ?property-id ?raw-value
          :where
          [?b ?property-id ?v]
          (or [?v :block/title ?raw-value]
              [?v :property.value/content ?raw-value])]
        db
        property-id
        raw-value)))

(defn- find-or-create-property-value
  "Find or create a property value. Only to be used with properties that have ref types"
  [conn property-id v]
  (or (get-property-value-eid @conn property-id v)
      (let [v-uuid (create-property-text-block! conn nil property-id v {})]
        (:db/id (d/entity @conn [:block/uuid v-uuid])))))

(defn- convert-ref-property-value
  "Converts a ref property's value whether it's an integer or a string. Creates
   a property ref value for a string value if necessary"
  [conn property-id v property-type]
  (if (and (integer? v)
           (or (not= property-type :number)
               ;; Allows :number property to use number as a ref (for closed value) or value
               (and (= property-type :number)
                    (or (= property-id (:db/ident (:logseq.property/created-from-property (d/entity @conn v))))
                        (= :logseq.property/empty-placeholder (:db/ident (d/entity @conn v)))))))
    v
    ;; only value-ref-property types should call this
    (find-or-create-property-value conn property-id v)))

(defn set-block-property!
  "Updates a block property's value for an existing property-id and block.  If
  property is a ref type, automatically handles a raw property value i.e. you
  can pass \"value\" instead of the property value entity. Also handle db
  attributes as properties"
  [conn block-eid property-id v]
  (let [block-eid (->eid block-eid)
        _ (assert (qualified-keyword? property-id) "property-id should be a keyword")
        block (d/entity @conn block-eid)
        property (d/entity @conn property-id)
        _ (assert (some? property) (str "Property " property-id " doesn't exist yet"))
        property-type (get-in property [:block/schema :type] :default)
        db-attribute? (contains? db-property/db-attribute-properties property-id)]
    (if db-attribute?
      (when-not (and (= property-id :block/alias) (= v (:db/id block))) ; alias can't be itself
        (ldb/transact! conn [{:db/id (:db/id block) property-id v}]
                       {:outliner-op :save-block}))
      (let [new-value (if (db-property-type/ref-property-types property-type)
                        (convert-ref-property-value conn property-id v property-type)
                        v)
            existing-value (get block property-id)]
        (when-not (= existing-value new-value)
          (raw-set-block-property! conn block property property-type new-value))))))

(defn batch-set-property!
  "Sets properties for multiple blocks. Automatically handles property value refs.
   Does no validation of property values.
   NOTE: This fn only works for properties with cardinality equal to `one`."
  [conn block-ids property-id v]
  (assert property-id "property-id is nil")
  (let [block-eids (map ->eid block-ids)
        property (d/entity @conn property-id)
        _ (assert (some? property) (str "Property " property-id " doesn't exist yet"))
        _ (assert (not (db-property/many? property)) "Property must be cardinality :one in batch-set-property!")
        property-type (get-in property [:block/schema :type] :default)
        _ (assert v "Can't set a nil property value must be not nil")
        v' (if (db-property-type/value-ref-property-types property-type)
             (convert-ref-property-value conn property-id v property-type)
             v)
        status? (= :logseq.task/status (:db/ident property))
        txs (mapcat
             (fn [eid]
               (if-let [block (d/entity @conn eid)]
                 (build-property-value-tx-data block property-id v' status?)
                 (js/console.error "Skipping setting a block's property because the block id could not be found:" eid)))
             block-eids)]
    (when (seq txs)
      (ldb/transact! conn txs {:outliner-op :save-block}))))

(defn batch-remove-property!
  [conn block-ids property-id]
  (let [block-eids (map ->eid block-ids)
        blocks (keep (fn [id] (d/entity @conn id)) block-eids)
        block-id-set (set (map :db/id blocks))]
    (when (seq blocks)
      (when-let [property (d/entity @conn property-id)]
        (let [txs (mapcat
                   (fn [block]
                     (let [value (get block property-id)
                           entities (cond
                                      (de/entity? value) [value]
                                      (and (coll? value) (every? de/entity? value)) value
                                      :else nil)
                           deleting-entities (filter
                                              (fn [value]
                                                (and
                                                 (:logseq.property/created-from-property value)
                                                 (not (or (ldb/page? value) (ldb/closed-value? value)))
                                                 (empty? (set/difference (set (map :e (d/datoms @conn :avet (:db/ident property) (:db/id value)))) block-id-set))))
                                              entities)
                           ;; Delete property value block if it's no longer used by other blocks
                           retract-blocks-tx (when (seq deleting-entities)
                                               (:tx-data (outliner-core/delete-blocks conn deleting-entities)))]
                       (concat
                        [[:db/retract (:db/id block) (:db/ident property)]]
                        retract-blocks-tx)))
                   blocks)]
          (when (seq txs)
            (ldb/transact! conn txs {:outliner-op :save-block})))))))

(defn remove-block-property!
  [conn eid property-id]
  (let [eid (->eid eid)]
    (if (contains? db-property/db-attribute-properties property-id)
      (when-let [block (d/entity @conn eid)]
        (ldb/transact! conn
                       [[:db/retract (:db/id block) property-id]]
                       {:outliner-op :save-block}))
      (batch-remove-property! conn [eid] property-id))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [conn block-eid property-id property-value]
  (when-let [property (d/entity @conn property-id)]
    (let [block (d/entity @conn block-eid)]
      (when (and block (not= property-id (:db/ident block)) (db-property/many? property))
        (let [current-val (get block property-id)
              fv (first current-val)]
          (if (and (= 1 (count current-val)) (or (= property-value fv) (= property-value (:db/id fv))))
            (remove-block-property! conn (:db/id block) property-id)
            (ldb/transact! conn
                           [[:db/retract (:db/id block) property-id property-value]]
                           {:outliner-op :save-block})))))))

(defn ^:api get-class-parents
  [db tags]
  (let [tags' (filter ldb/class? tags)
        result (map
                (fn [id] (d/entity db id))
                (set (mapcat ldb/get-class-parents tags')))]
    (set result)))

(defn ^:api get-class-properties
  [db class]
  (let [class-parents (get-class-parents db [class])]
    (->> (mapcat (fn [class]
                   (:class/schema.properties class)) (concat [class] class-parents))
         (common-util/distinct-by :db/id)
         (ldb/sort-by-order))))

(defn ^:api get-block-classes-properties
  [db eid]
  (let [block (d/entity db eid)
        classes (->> (:block/tags block)
                     (sort-by :block/name)
                     (filter ldb/class?))
        class-parents (get-class-parents db classes)
        all-classes (->> (concat classes class-parents)
                         (filter (fn [class]
                                   (seq (:class/schema.properties class)))))
        all-properties (-> (mapcat (fn [class]
                                     (map :db/ident (:class/schema.properties class))) all-classes)
                           distinct)]
    {:classes classes
     :all-classes all-classes           ; block own classes + parent classes
     :classes-properties all-properties}))

(defn- property-with-position?
  [db property-id block-properties position]
  (and
   (some? (get block-properties property-id))
   (let [schema (:block/schema (d/entity db property-id))]
     (= (:position schema) position))))

(defn property-with-other-position?
  [property]
  (let [schema (:block/schema property)]
    (not (contains? #{:properties nil} (:position schema)))))

(defn get-block-positioned-properties
  [db eid position]
  (let [block (d/entity db eid)
        own-properties (keys (:block/properties block))]
    (->> (:classes-properties (get-block-classes-properties db eid))
         (concat own-properties)
         (filter (fn [id] (property-with-position? db id (:block/properties block) position)))
         (distinct)
         (map #(d/entity db %))
         (ldb/sort-by-order)
         (map :db/ident))))

(defn block-has-viewable-properties?
  [block-entity]
  (let [properties (->> (keys (:block/properties block-entity))
                        (remove #{:logseq.property/icon :logseq.property/built-in?}))]
    (or
     (seq (:block/alias block-entity))
     (seq (:block/tags block-entity))
     (seq properties))))

(defn- build-closed-value-tx
  [db property resolved-value {:keys [id icon]}]
  (let [block (when id (d/entity db [:block/uuid id]))
        block-id (or id (ldb/new-block-id))
        icon (when-not (and (string? icon) (string/blank? icon)) icon)
        tx-data (if block
                  [(cond->
                    (outliner-core/block-with-updated-at
                     (merge
                      {:block/uuid id
                       :block/closed-value-property (:db/id property)}
                      (if (db-property-type/original-value-ref-property-types (get-in property [:block/schema :type]))
                        {:property.value/content resolved-value}
                        {:block/title resolved-value})))
                     icon
                     (assoc :logseq.property/icon icon))]
                  (let [max-order (:block/order (last (:property/closed-values property)))
                        new-block (-> (db-property-build/build-closed-value-block block-id resolved-value
                                                                                  property {:icon icon})
                                      (assoc :block/order (db-order/gen-key max-order nil)))]
                    [new-block
                     (outliner-core/block-with-updated-at
                      {:db/id (:db/id property)})]))
        tx-data' (if (and (:db/id block) (nil? icon))
                   (conj tx-data [:db/retract (:db/id block) :logseq.property/icon])
                   tx-data)]
    tx-data'))

(defn upsert-closed-value!
  "id should be a block UUID or nil"
  [conn property-id {:keys [id value description] :as opts}]
  (assert (or (nil? id) (uuid? id)))
  (let [db @conn
        property (d/entity db property-id)
        property-schema (:block/schema property)
        property-type (get property-schema :type :default)]
    (when (contains? db-property-type/closed-value-property-types property-type)
      (let [value' (if (string? value) (string/trim value) value)
            resolved-value (convert-property-input-string (:type property-schema) value')
            validate-message (validate-property-value
                              (get-property-value-schema @conn property-type property {:new-closed-value? true})
                              resolved-value)]
        (cond
          (some (fn [b]
                  (and (= (str resolved-value) (str (or (db-property/closed-value-content b)
                                                        (:block/uuid b))))
                       (not= id (:block/uuid b))))
                (entity-plus/lookup-kv-then-entity property :property/closed-values))

          ;; Make sure to update frontend.handler.db-based.property-test when updating ex-info message
          (throw (ex-info "Closed value choice already exists"
                          {:error :value-exists
                           :type :notification
                           :payload {:message "Choice already exists"
                                     :type :warning}}))

          validate-message
          ;; Make sure to update frontend.handler.db-based.property-test when updating ex-info message
          (throw (ex-info "Invalid property value"
                          {:error :value-invalid
                           :type :notification
                           :payload {:message validate-message
                                     :type :warning}}))

          (nil? resolved-value)
          nil

          :else
          (let [tx-data (build-closed-value-tx @conn property resolved-value opts)]
            (ldb/transact! conn tx-data {:outliner-op :save-block})

            (when (seq description)
              (if-let [desc-ent (and id (:logseq.property/description (d/entity db [:block/uuid id])))]
                (ldb/transact! conn
                               [(outliner-core/block-with-updated-at {:db/id (:db/id desc-ent)
                                                                      :block/title description})]
                               {:outliner-op :save-block})
                (set-block-property! conn
                                     ;; new closed value is first in tx-data
                                     [:block/uuid (or id (:block/uuid (first tx-data)))]
                                     :logseq.property/description
                                     description)))))))))

(defn add-existing-values-to-closed-values!
  "Adds existing values as closed values and returns their new block uuids"
  [conn property-id values]
  (when-let [property (d/entity @conn property-id)]
    (when (seq values)
      (let [values' (remove string/blank? values)]
        (assert (every? uuid? values') "existing values should all be UUIDs")
        (let [values (keep #(d/entity @conn [:block/uuid %]) values')]
          (when (seq values)
            (let [value-property-tx (map (fn [id]
                                           {:db/id id
                                            :block/type "closed value"
                                            :block/closed-value-property (:db/id property)})
                                         (map :db/id values))
                  property-tx (outliner-core/block-with-updated-at {:db/id (:db/id property)})]
              (ldb/transact! conn (cons property-tx value-property-tx)
                             {:outliner-op :save-blocks}))))))))

(defn delete-closed-value!
  "Returns true when deleted or if not deleted displays warning and returns false"
  [conn property-id value-block-id]
  (when-let [value-block (d/entity @conn value-block-id)]
    (if (ldb/built-in? value-block)
      (throw (ex-info "The choice can't be deleted"
                      {:type :notification
                       :payload {:message "The choice can't be deleted because it's built-in."
                                 :type :warning}}))
      (let [data (:tx-data (outliner-core/delete-blocks conn [value-block]))
            tx-data (conj data (outliner-core/block-with-updated-at
                                {:db/id property-id}))]
        (ldb/transact! conn tx-data)))))

(defn class-add-property!
  [conn class-id property-id]
  (when-let [class (d/entity @conn class-id)]
    (if (ldb/class? class)
      (ldb/transact! conn
                     [[:db/add (:db/id class) :class/schema.properties property-id]]
                     {:outliner-op :save-block})
      (throw (ex-info "Can't add a property to a block that isn't a class"
                      {:class-id class-id :property-id property-id})))))

(defn class-remove-property!
  [conn class-id property-id]
  (when-let [class (d/entity @conn class-id)]
    (when (ldb/class? class)
      (when-let [property (d/entity @conn property-id)]
        (when-not (ldb/built-in-class-property? class property)
          (ldb/transact! conn [[:db/retract (:db/id class) :class/schema.properties property-id]]
                         {:outliner-op :save-block}))))))
