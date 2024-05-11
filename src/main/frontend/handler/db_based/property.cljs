(ns frontend.handler.db-based.property
  "Properties handler for db graphs"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [frontend.handler.notification :as notification]
            [frontend.handler.db-based.property.util :as db-pu]
            [logseq.outliner.core :as outliner-core]
            [frontend.util :as util]
            [frontend.state :as state]
            [logseq.common.util :as common-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.property.build :as db-property-build]
            [malli.util :as mu]
            [malli.error :as me]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.core :as d]
            [datascript.impl.entity :as e]
            [logseq.db.frontend.property :as db-property]
            [frontend.handler.property.util :as pu]
            [promesa.core :as p]
            [logseq.db :as ldb]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.order :as db-order]))

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(defn- build-property-value-tx-data
  ([block property-id value]
   (build-property-value-tx-data block property-id value (= property-id :logseq.task/status)))
  ([block property-id value status?]
   (when (some? value)
     (let [block (assoc (outliner-core/block-with-updated-at {:db/id (:db/id block)})
                        property-id value)
           block-tx-data (cond-> block
                          status?
                           (assoc :block/tags :logseq.class/task))]
       [block-tx-data]))))

(defn- get-property-value-schema
  "Gets a malli schema to validate the property value for the given property type and builds
   it with additional args like datascript db"
  [property-type property & {:keys [new-closed-value?]
                             :or {new-closed-value? false}}]
  (let [property-val-schema (or (get db-property-type/built-in-validation-schemas property-type)
                                (throw (ex-info (str "No validation for property type " (pr-str property-type)) {})))
        [schema-opts schema-fn] (if (vector? property-val-schema)
                                  (rest property-val-schema)
                                  [{} property-val-schema])]
    [:fn
     schema-opts
     (fn property-value-schema [property-val]
       (db-malli-schema/validate-property-value (db/get-db) schema-fn [property property-val] {:new-closed-value? new-closed-value?}))]))

(defn- fail-parse-long
  [v-str]
  (let [result (parse-long v-str)]
    (or result
        (throw (js/Error. (str "Can't convert \"" v-str "\" to a number"))))))

(defn- fail-parse-double
  [v-str]
  (let [result (parse-double v-str)]
    (or result
        (throw (js/Error. (str "Can't convert \"" v-str "\" to a number"))))))

(defn- infer-schema-from-input-string
  [v-str]
  (try
    (cond
      (fail-parse-long v-str) :number
      (fail-parse-double v-str) :number
      (common-util/url? v-str) :url
      (contains? #{"true" "false"} (string/lower-case v-str)) :checkbox
      :else :default)
    (catch :default _e
      :default)))

(defn convert-property-input-string
  [schema-type v-str]
  (if (and (= :number schema-type) (string? v-str))
    (fail-parse-double v-str)
    v-str))

(defn- update-datascript-schema
  [property {:keys [cardinality]}]
  (let [ident (:db/ident property)
        cardinality (if (= cardinality :many) :db.cardinality/many :db.cardinality/one)]
    {:db/ident ident
     :db/valueType :db.type/ref
     :db/cardinality cardinality}))

(defn ensure-unique-db-ident
  "Ensures the given db-ident is unique. If a db-ident conflicts, it is made
  unique by adding a suffix with a unique number e.g. :db-ident-1 :db-ident-2"
  [db db-ident]
  (if (d/entity db db-ident)
    (let [existing-idents
          (d/q '[:find [?ident ...]
                 :in $ ?ident-name
                 :where
                 [?b :db/ident ?ident]
                 [(str ?ident) ?str-ident]
                 [(clojure.string/starts-with? ?str-ident ?ident-name)]]
               db
               (str db-ident "-"))
          new-ident (if-let [max-num (->> existing-idents
                                          (keep #(parse-long (string/replace-first (str %) (str db-ident "-") "")))
                                          (apply max))]
                      (keyword (namespace db-ident) (str (name db-ident) "-" (inc max-num)))
                      (keyword (namespace db-ident) (str (name db-ident) "-1")))]
      new-ident)
    db-ident))

(defn upsert-property!
  "Updates property if property-id is given. Otherwise creates a property
   with the given property-id or :property-name option. When a property is created
   it is ensured to have a unique :db/ident"
  [repo property-id schema {:keys [property-name properties]}]
  (let [db-ident (or property-id (db-property/create-user-property-ident-from-name property-name))]
    (assert (qualified-keyword? db-ident))
    (if-let [property (and (qualified-keyword? property-id) (db/entity db-ident))]
      (let [changed-property-attrs
            ;; Only update property if something has changed as we are updating a timestamp
            (cond-> {}
              (not= schema (:block/schema property))
              (assoc :block/schema schema)
              (and (some? property-name) (not= property-name (:block/original-name property)))
              (assoc :block/original-name property-name))
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
              (conj (update-datascript-schema property schema)))
            tx-data (concat property-tx-data
                            (when (seq properties)
                              (mapcat
                               (fn [[property-id v]]
                                 (build-property-value-tx-data property property-id v)) properties)))
            many->one? (and (db-property/many? property) (= :one (:cardinality schema)))]
        (when (seq tx-data)
          (db/transact! repo tx-data {:outliner-op :update-property
                                      :property-id (:db/id property)
                                      :many->one? many->one?})))
      (let [k-name (or (and property-name (name property-name))
                       (name property-id))
            db-ident' (ensure-unique-db-ident (db/get-db repo) db-ident)]
        (assert (some? k-name)
                (prn "property-id: " property-id ", property-name: " property-name))
        (db/transact! repo
                      [(sqlite-util/build-new-property db-ident' schema {:original-name k-name
                                                                         :from-ui-thread? true})]
                      {:outliner-op :new-property})))))

(defn validate-property-value
  [schema value]
  (me/humanize (mu/explain-data schema value)))

(defn- resolve-tag
  "Change `v` to a tag's db id if v is a string tag, e.g. `#book`"
  [v]
  (when (and (string? v)
             (util/tag? (string/trim v)))
    (let [tag-without-hash (common-util/safe-subs (string/trim v) 1)
          tag (or (page-ref/get-page-name tag-without-hash) tag-without-hash)]
      (when-not (string/blank? tag)
        (let [e (db/get-case-page tag)
              e' (if e
                   (do
                     (when-not (contains? (:block/type e) "tag")
                       (db/transact! [{:db/id (:db/id e)
                                       :block/type (set (conj (:block/type e) "class"))}]))
                     e)
                   (let [m (assoc (block/page-name->map tag true)
                                  :block/type #{"class"})]
                     (db/transact! [m])
                     m))]
          (:db/id e'))))))

(defn- ->eid
  [id]
  (if (uuid? id) [:block/uuid id] id))

(defn set-block-property!
  "Updates a block property's value for the an existing property-id. If possibly
  creating a new property, use upsert-property!"
  [repo block-eid property-id v {:keys [property-name property-type]}]
  (let [block-eid (->eid block-eid)
        _ (assert (qualified-keyword? property-id) "property-id should be a keyword")
        block (db/entity repo block-eid)
        property (db/entity property-id)
        k-name (:block/original-name property)
        property-schema (:block/schema property)
        {:keys [type]} property-schema
        v' (or (resolve-tag v) v)
        db-attribute? (contains? db-property/db-attribute-properties property-id)]
    (cond
      db-attribute?
      (db/transact! repo [{:db/id (:db/id block) property-id v'}]
                    {:outliner-op :save-block})

      :else
      (let [v'' (if property v' (or v' ""))]
        (when (some? v'')
          (let [infer-schema (when-not type (infer-schema-from-input-string v''))
                property-type' (or type property-type infer-schema :default)
                schema (get-property-value-schema property-type' (or property
                                                                     {:block/schema {:type property-type'}}))
                existing-value (when-let [id (:db/ident property)]
                                 (get block id))
                new-value* (if (= v'' :logseq.property/empty-placeholder)
                             v''
                             (try
                               (convert-property-input-string property-type' v'')
                               (catch :default e
                                 (js/console.error e)
                                 (notification/show! (str e) :error false)
                                 nil)))]
            (when-not (= existing-value new-value*)
              (if-let [msg (validate-property-value schema
                                                    ;; normalize :many values for components that only provide single value
                                                    (if (and (db-property/many? property) (not (coll? new-value*)))
                                                      #{new-value*}
                                                      new-value*))]
                (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
                  (notification/show! msg' :warning))
                (let [_ (upsert-property! repo property-id (assoc property-schema :type property-type') {:property-name property-name})
                      status? (= :logseq.task/status (:db/ident property))
                      ;; don't modify maps
                      new-value (if (or (sequential? new-value*) (set? new-value*))
                                  (if (= :coll property-type')
                                    (vec (remove string/blank? new-value*))
                                    (set (remove string/blank? new-value*)))
                                  new-value*)
                      tx-data (build-property-value-tx-data block property-id new-value status?)]
                  (db/transact! repo tx-data {:outliner-op :save-block}))))))))))

(defn class-add-property!
  [repo class-uuid property-id]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (contains? (:block/type class) "class")
      (let [[db-ident property options]
            ;; strings come from user
            (if (string? property-id)
              (if-let [ent (ldb/get-case-page (db/get-db repo) property-id)]
                [(:db/ident ent) ent {}]
                ;; creates ident beforehand b/c needed in later transact and this avoids
                ;; making this whole fn async for now
                [(ensure-unique-db-ident
                  (db/get-db (state/get-current-repo))
                  (db-property/create-user-property-ident-from-name property-id))
                 nil
                 {:property-name property-id}])
              [property-id (db/entity property-id) {}])
            property-type (get-in property [:block/schema :type])
            _ (upsert-property! repo
                                db-ident
                                (cond-> (:block/schema property)
                                  (some? property-type)
                                  (assoc :type property-type))
                                options)]
        (db/transact! repo
                      [[:db/add (:db/id class) :class/schema.properties db-ident]]
                      {:outliner-op :save-block})))))

(defn class-remove-property!
  [repo class-uuid property-id]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (contains? (:block/type class) "class")
      (when-let [property (db/entity repo property-id)]
        (when-not (ldb/built-in-class-property? class property)
          (db/transact! repo [[:db/retract (:db/id class) :class/schema.properties property-id]]
                        {:outliner-op :save-block}))))))

(defn batch-set-property!
  "Notice that this works only for properties with cardinality equals to `one`."
  [repo block-ids property-id v]
  (assert property-id "property-id is nil")
  (let [block-eids (map ->eid block-ids)
        property (db/entity property-id)]
    (when property
      (let [type (:type (:block/schema property))
            infer-schema (when-not type (infer-schema-from-input-string v))
            property-type (or type infer-schema :default)
            many? (db-property/many? property)
            status? (= :logseq.task/status (:db/ident property))
            txs (->>
                 (mapcat
                  (fn [eid]
                    (when-let [block (db/entity eid)]
                      (when (and (some? v) (not many?))
                        (when-let [v* (try
                                        (convert-property-input-string property-type v)
                                        (catch :default e
                                          (notification/show! (str e) :error false)
                                          nil))]
                          (build-property-value-tx-data block property-id v* status?)))))
                  block-eids)
                 (remove nil?))]
        (when (seq txs)
          (db/transact! repo txs {:outliner-op :save-block}))))))

(defn batch-remove-property!
  [repo block-ids property-id]
  (let [block-eids (map ->eid block-ids)]
    (when-let [property (db/entity property-id)]
      (let [txs (mapcat
                 (fn [eid]
                   (when-let [block (db/entity eid)]
                     (let [value (get block property-id)
                           block-value? (= :default (get-in property [:block/schema :type] :default))
                           property-block (when block-value? (db/entity (:db/id value)))
                           retract-blocks-tx (when (and property-block
                                                        (some? (get property-block :logseq.property/created-from-property)))
                                               (let [txs-state (atom [])]
                                                 (outliner-core/delete-block repo
                                                                             (db/get-db false)
                                                                             txs-state
                                                                             property-block
                                                                             {:children? true})
                                                 @txs-state))]
                       (concat
                        [[:db/retract eid (:db/ident property)]]
                        retract-blocks-tx))))
                 block-eids)]
        (when (seq txs)
          (db/transact! repo txs {:outliner-op :save-block}))))))

(defn remove-block-property!
  [repo eid property-id]
  (let [eid (->eid eid)]
    (if (contains? db-property/db-attribute-properties property-id)
     (when-let [block (db/entity eid)]
       (db/transact! repo
                     [[:db/retract (:db/id block) property-id]]
                     {:outliner-op :save-block}))
     (batch-remove-property! repo [eid] property-id))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [repo block property-id property-value]
  (when block
    (when (not= property-id (:db/ident block))
      (when-let [property (db/entity property-id)]
        (if (db-property/many? property)
          (db/transact! repo
                        [[:db/retract (:db/id block) property-id property-value]]
                        {:outliner-op :save-block})
          (if (= :default (get-in property [:block/schema :type]))
            (set-block-property! repo (:db/id block)
                                 (:db/ident property)
                                 ""
                                 {})
            (remove-block-property! repo (:db/id block) property-id)))))))

(defn collapse-expand-property!
  "Notice this works only if the value itself if a block (property type should be either :default or :template)"
  [repo block property collapse?]
  (let [f (if collapse? :db/add :db/retract)]
    (db/transact! repo
                  [[f (:db/id block) :block/collapsed-properties (:db/id property)]]
                  {:outliner-op :save-block})))

(defn get-class-parents
  [tags]
  (let [tags' (filter (fn [tag] (contains? (:block/type tag) "class")) tags)
        *classes (atom #{})]
    (doseq [tag tags']
      (when-let [parent (:class/parent tag)]
        (loop [current-parent parent]
          (when (and
                 current-parent
                 (contains? (:block/type parent) "class")
                 (not (contains? @*classes (:db/id parent))))
            (swap! *classes conj current-parent)
            (recur (:class/parent current-parent))))))
    @*classes))

(defn get-block-classes-properties
  [eid]
  (let [block (db/entity eid)
        classes (->> (:block/tags block)
                     (sort-by :block/name)
                     (filter (fn [tag] (contains? (:block/type tag) "class"))))
        class-parents (get-class-parents classes)
        all-classes (->> (concat classes class-parents)
                         (filter (fn [class]
                                   (seq (:class/schema.properties class)))))
        all-properties (-> (mapcat (fn [class]
                                     (map :db/ident (:class/schema.properties class))) all-classes)
                           distinct)]
    {:classes classes
     :all-classes all-classes           ; block own classes + parent classes
     :classes-properties all-properties}))

(defn- closed-value-other-position?
  [property-id block-properties]
  (and
   (some? (get block-properties property-id))
   (let [schema (:block/schema (db/entity property-id))]
     (= (:position schema) "block-beginning"))))

(defn get-block-other-position-properties
  [eid]
  (let [block (db/entity eid)
        own-properties (keys (:block/properties block))]
    (->> (:classes-properties (get-block-classes-properties eid))
         (concat own-properties)
         (filter (fn [id] (closed-value-other-position? id (:block/properties block))))
         (distinct))))

(defn block-has-viewable-properties?
  [block-entity]
  (let [properties (:block/properties block-entity)]
    (or
     (seq (:block/alias block-entity))
     (and (seq properties)
          (not= properties [:logseq.property/icon])))))

(defn create-property-text-block!
  [block property value parse-block {:keys [class-schema?]}]
  (assert (e/entity? property))
  (let [repo (state/get-current-repo)
        new-value-block (db-property-build/build-property-value-block block property value parse-block)
        class? (contains? (:block/type block) "class")
        property-id (:db/ident property)]
    (p/let [_ (db/transact! repo [new-value-block] {:outliner-op :insert-blocks})]
      (let [result (when property-id
                     (if (and class? class-schema?)
                       (class-add-property! repo (:db/id block) property-id)
                       (when-let [block-id (:db/id (db/entity [:block/uuid (:block/uuid new-value-block)]))]
                         (set-block-property! repo (:db/id block) property-id block-id {}))))]
        {:block-id (:block/uuid new-value-block)
         :result result}))))

(defn property-create-new-block-from-template
  [_block property template]
  (let [page-name (str "$$$" (:block/uuid property))
        page-entity (db/get-case-page page-name)
        page (or page-entity
                 (-> (block/page-name->map page-name true)
                     (assoc :block/type #{"hidden"}
                            :block/format :markdown
                            :logseq.property/source-page (:db/id property))))
        page-tx (when-not page-entity page)
        page-id [:block/uuid (:block/uuid page)]
        block-id (db/new-block-id)
        new-block (-> {:block/uuid block-id
                       :block/format :markdown
                       :block/content ""
                       :block/tags #{(:db/id template)}
                       :block/page page-id
                       :block/parent page-id
                       :logseq.property/created-from-property (:db/id property)
                       :logseq.property/created-from-template [:block/uuid (:block/uuid template)]}
                      sqlite-util/block-with-timestamps)]
    {:page page-tx
     :blocks [new-block]}))

(defn re-init-commands!
  "Update commands after task status and priority's closed values has been changed"
  [property]
  (when (contains? #{:logseq.task/status :logseq.task/priority} (:db/ident property))
    (state/pub-event! [:init/commands])))

(defn replace-closed-value
  [property new-id old-id]
  (assert (and (uuid? new-id) (uuid? old-id)))
  (db/transact! (state/get-current-repo)
                [[:db/retract [:block/uuid old-id] :block/closed-value-property (:db/id property)]
                 [:db/add [:block/uuid new-id] :block/closed-value-property (:db/id property)]]
                {:outliner-op :save-block}))

(defn <upsert-closed-value
  "id should be a block UUID or nil"
  [property {:keys [id value icon description]
             :or {description ""}}]
  (assert (or (nil? id) (uuid? id)))
  (let [property-type (get-in property [:block/schema :type] :default)]
    (when (contains? db-property-type/closed-value-property-types property-type)
      (p/let [property (db/entity (:db/id property))
              value (if (string? value) (string/trim value) value)
              property-schema (:block/schema property)
              closed-values (:property/closed-values property)
              default-closed-values? (and (= :default property-type) (seq closed-values))
              value (if (and default-closed-values? (string? value) (not (string/blank? value)))
                      (p/let [result (create-property-text-block! nil property value nil {})]
                        (:db/id (db/entity [:block/uuid (:block-id result)])))
                      value)
              resolved-value (try
                               (convert-property-input-string (:type property-schema) value)
                               (catch :default e
                                 (js/console.error e)
                                 (notification/show! (str e) :error false)
                                 nil))
              block (when id (db/entity [:block/uuid id]))
              validate-message (validate-property-value
                                (get-property-value-schema property-type property {:new-closed-value? true})
                                resolved-value)]
        (cond
          (some (fn [b]
                  (and (= (str resolved-value) (str (or (db-pu/property-value-when-closed b)
                                                        (:block/uuid b))))
                       (not= id (:block/uuid b)))) closed-values)
          (do
            (notification/show! "Choice already exists" :warning)
            :value-exists)

          validate-message
          (do
            (notification/show! validate-message :warning)
            :value-invalid)

          (nil? resolved-value)
          nil

          :else
          (let [block-id (or id (db/new-block-id))
                icon (when-not (and (string? icon) (string/blank? icon)) icon)
                description (string/trim description)
                description (when-not (string/blank? description) description)
                tx-data (if block
                          [(let [schema (:block/schema block)]
                             (cond->
                              (outliner-core/block-with-updated-at
                               {:block/uuid id
                                :block/content resolved-value
                                :block/closed-value-property (:db/id property)
                                :block/schema (if description
                                                (assoc schema :description description)
                                                (dissoc schema :description))})
                               icon
                               (assoc :logseq.property/icon icon)))]
                          (let [max-order (:block/order (last (:property/closed-values property)))
                                new-block (-> (db-property-build/build-closed-value-block block-id resolved-value
                                                                                                property {:icon icon
                                                                                                          :description description})
                                              (assoc :block/order (db-order/gen-key max-order nil)))]
                            [new-block
                             (outliner-core/block-with-updated-at
                              {:db/id (:db/id property)})]))]
            {:block-id block-id
             :tx-data tx-data}))))))

(defn <add-existing-values-to-closed-values!
  "Adds existing values as closed values and returns their new block uuids"
  [property values]
  (assert (e/entity? property))
  (when (seq values)
    (let [values' (remove string/blank? values)]
      (assert (every? uuid? values') "existing values should all be UUIDs")
      (p/let [values (keep #(db/entity [:block/uuid %]) values')]
        (when (seq values)
          (let [value-property-tx (map (fn [id]
                                         {:db/id id
                                          :block/type "closed value"
                                          :block/closed-value-property (:db/id property)})
                                       (map :db/id values))
                property-tx (outliner-core/block-with-updated-at {:db/id (:db/id property)})]
            (db/transact! (state/get-current-repo) (cons property-tx value-property-tx)
                          {:outliner-op :save-blocks})))))))

(defn delete-closed-value!
  "Returns true when deleted or if not deleted displays warning and returns false"
  [property value-block]
  (cond
    (ldb/built-in? value-block)
    (do (notification/show! "The choice can't be deleted because it's built-in." :warning)
        false)

    (seq (:block/_refs value-block))
    (do (notification/show! "The choice can't be deleted because it's still used." :warning)
        false)

    :else
    (let [property (db/entity (:db/id property))
          tx-data [[:db/retractEntity (:db/id value-block)]
                   (outliner-core/block-with-updated-at
                    {:db/id (:db/id property)})]]
      (p/do!
       (db/transact! tx-data)
       (re-init-commands! property)
       true))))

(defn get-property-block-created-block
  "Get the root block and property that created this property block."
  [eid]
  (let [block (db/entity eid)
        created-from-property (:logseq.property/created-from-property block)]
    {:from-property-id (:db/id created-from-property)}))

(defn batch-set-property-closed-value!
  [block-ids db-ident closed-value]
  (if-let [closed-value-entity (pu/get-closed-value-entity-by-name db-ident closed-value)]
    (batch-set-property! (state/get-current-repo)
                         block-ids
                         db-ident
                         (:db/id closed-value-entity))
    (js/console.error (str "No entity found for closed value " (pr-str closed-value)))))
