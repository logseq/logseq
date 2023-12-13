(ns frontend.handler.db-based.property
  "Properties handler for db graphs"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.format.block :as block]
            [frontend.handler.notification :as notification]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.util :as util]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.property.util :as db-property-util]
            [malli.util :as mu]
            [malli.error :as me]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [datascript.impl.entity :as e]))

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(defn built-in-validation-schemas
  "A frontend version of built-in-validation-schemas that adds the current database to
   schema fns"
  [property & {:keys [new-closed-value?]
               :or {new-closed-value? false}}]
  (into {}
        (map (fn [[property-type property-val-schema]]
               (cond
                 (db-property-type/closed-value-property-types property-type)
                 (let [[_ schema-opts schema-fn] property-val-schema
                       schema-fn' (if (db-property-type/property-types-with-db property-type) #(schema-fn (db/get-db) %) schema-fn)]
                   [property-type [:fn
                                   schema-opts
                                   #((db-property-type/type-or-closed-value? schema-fn') (db/get-db) property % new-closed-value?)]])
                 (db-property-type/property-types-with-db property-type)
                 (let [[_ schema-opts schema-fn] property-val-schema]
                   [property-type [:fn schema-opts #(schema-fn (db/get-db) %)]])
                 :else
                 [property-type property-val-schema]))
             db-property-type/built-in-validation-schemas)))

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
      (util/uuid-string? v-str) :page
      (gp-util/url? v-str) :url
      (contains? #{"true" "false"} (string/lower-case v-str)) :checkbox
      :else :default)
    (catch :default _e
      :default)))

(defn convert-property-input-string
  [schema-type v-str]
  (if (and (not (string? v-str)) (not (object? v-str)))
    v-str
    (case schema-type
      :number
      (fail-parse-double v-str)

      :page
      (uuid v-str)

      ;; these types don't need to be translated. :date expects uuid and other
      ;; types usually expect text
      (:url :date :any)
      v-str

      ;; :default
      (if (util/uuid-string? v-str) (uuid v-str) v-str))))

(defn upsert-property!
  [repo k-name schema {:keys [property-uuid]}]
  (let [property (db/entity [:block/name (gp-util/page-name-sanity-lc k-name)])
        k-name (name k-name)
        property-uuid (or (:block/uuid property) property-uuid (db/new-block-id))]
    (when property
      (db/transact! repo [(outliner-core/block-with-updated-at
                           {:block/schema schema
                            :block/uuid property-uuid
                            :block/type "property"})]
                    {:outliner-op :save-block}))
    (when (nil? property) ;if property not exists yet
      (db/transact! repo [(sqlite-util/build-new-property
                           (cond-> {:block/original-name k-name
                                    :block/name (util/page-name-sanity-lc k-name)
                                    :block/uuid property-uuid}
                             (seq schema)
                             (assoc :block/schema schema)))]
                    {:outliner-op :insert-blocks}))))

(defn validate-property-value
  [schema value]
  (me/humanize (mu/explain-data schema value)))

(defn- reset-block-property-multiple-values!
  [repo block-id k-name values _opts]
  (let [block (db/entity repo [:block/uuid block-id])
        k-name (name k-name)
        property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
        values (remove nil? values)
        property-uuid (or (:block/uuid property) (db/new-block-id))
        property-schema (:block/schema property)
        {:keys [type cardinality]} property-schema
        multiple-values? (= cardinality :many)]
    (when (and multiple-values? (seq values))
      (let [infer-schema (when-not type (infer-schema-from-input-string (first values)))
            property-type (or type infer-schema :default)
            schema (get (built-in-validation-schemas property) property-type)
            properties (:block/properties block)
            values' (try
                      (set (map #(convert-property-input-string property-type %) values))
                      (catch :default e
                        (notification/show! (str e) :error false)
                        nil))
            tags-or-alias? (and (contains? #{"tags" "alias"} (string/lower-case k-name)) (uuid? (first values')))
            attribute (when tags-or-alias? (case (string/lower-case k-name)
                                             "alias"
                                             :block/alias
                                             "tags"
                                             :block/tags))
            old-values (if tags-or-alias?
                         (->> (get block attribute)
                              (map (fn [e] (:block/uuid e))))
                         (get properties property-uuid))]
        (when (not= old-values values')
          (if tags-or-alias?
            (let [property-value-ids (map (fn [id] (:db/id (db/entity [:block/uuid id]))) values')]
              (db/transact! repo
                            [[:db/retract (:db/id block) attribute]
                             {:block/uuid block-id
                              attribute property-value-ids}]
                            {:outliner-op :save-block}))
            (if-let [msg (some #(validate-property-value schema %) values')]
              (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
                (notification/show! msg' :warning))
              (do
                (upsert-property! repo k-name (assoc property-schema :type property-type)
                                  {:property-uuid property-uuid})
                (let [block-properties (assoc properties property-uuid values')
                      refs (outliner-core/rebuild-block-refs repo block block-properties)]
                  (db/transact! repo
                                [[:db/retract (:db/id block) :block/refs]
                                 {:block/uuid (:block/uuid block)
                                  :block/properties block-properties
                                  :block/refs refs}]
                                {:outliner-op :save-block}))))))))))

(defn- resolve-tag
  "Change `v` to a tag's UUID if v is a string tag, e.g. `#book`"
  [v]
  (when (and (string? v)
             (util/tag? (string/trim v)))
    (let [tag-without-hash (gp-util/safe-subs (string/trim v) 1)
          tag (or (page-ref/get-page-name tag-without-hash) tag-without-hash)]
      (when-not (string/blank? tag)
        (let [e (db/entity [:block/name (util/page-name-sanity-lc tag)])
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
          (:block/uuid e'))))))

(defn set-block-property!
  [repo block-id k-name v {:keys [old-value] :as opts}]
  (let [block (db/entity repo [:block/uuid block-id])
        k-name (name k-name)
        property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
        property-uuid (or (:block/uuid property) (db/new-block-id))
        property-schema (:block/schema property)
        {:keys [type cardinality]} property-schema
        multiple-values? (= cardinality :many)
        v (or (resolve-tag v) v)]
    (if (and multiple-values? (coll? v))
      (reset-block-property-multiple-values! repo block-id k-name v opts)
      (let [v (if property v (or v ""))]
        (when (some? v)
          (let [infer-schema (when-not type (infer-schema-from-input-string v))
                property-type (or type infer-schema :default)
                schema (get (built-in-validation-schemas property) property-type)
                properties (:block/properties block)
                value (get properties property-uuid)
                v* (try
                     (convert-property-input-string property-type v)
                     (catch :default e
                       (js/console.error e)
                       (notification/show! (str e) :error false)
                       nil))
                tags-or-alias? (and (contains? #{"tags" "alias"} (string/lower-case k-name)) (uuid? v*))]
            (if tags-or-alias?
              (let [property-value-id (:db/id (db/entity [:block/uuid v*]))
                    attribute (case (string/lower-case k-name)
                                "alias"
                                :block/alias
                                "tags"
                                :block/tags)]
                (db/transact! repo
                              [[:db/add (:db/id block) attribute property-value-id]]
                              {:outliner-op :save-block}))
              (when-not (contains? (if (set? value) value #{value}) v*)
                (if-let [msg (validate-property-value schema v*)]
                  (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
                    (notification/show! msg' :warning))
                  (do
                    (upsert-property! repo k-name (assoc property-schema :type property-type)
                                      {:property-uuid property-uuid})
                    (let [new-value (cond
                                      (and multiple-values? old-value
                                           (not= old-value :frontend.components.property/new-value-placeholder))
                                      (if (coll? v*)
                                        (vec (distinct (concat value v*)))
                                        (let [v (mapv (fn [x] (if (= x old-value) v* x)) value)]
                                          (if (contains? (set v) v*)
                                            v
                                            (conj v v*))))

                                      multiple-values?
                                      (let [f (if (coll? v*) concat conj)]
                                        (f value v*))

                                      :else
                                      v*)
                          ;; don't modify maps
                          new-value (if (or (sequential? new-value) (set? new-value))
                                      (if (= :coll property-type)
                                        (vec (remove string/blank? new-value))
                                        (set (remove string/blank? new-value)))
                                      new-value)
                          block-properties (assoc properties property-uuid new-value)
                          refs (outliner-core/rebuild-block-refs repo
                                                                 block
                                                                 block-properties)]
                      (db/transact! repo
                                    [[:db/retract (:db/id block) :block/refs]
                                     {:block/uuid (:block/uuid block)
                                      :block/properties block-properties
                                      :block/refs refs}]
                                    {:outliner-op :save-block}))))))))))))

(defn- fix-cardinality-many-values!
  [repo property-uuid]
  (let [ev (->> (model/get-block-property-values property-uuid)
                (remove (fn [[_ v]] (coll? v))))
        tx-data (map (fn [[e v]]
                       (let [entity (db/entity e)
                             properties (:block/properties entity)]
                         {:db/id e
                          :block/properties (assoc properties property-uuid #{v})})) ev)]
    (when (seq tx-data)
      (db/transact! repo tx-data
                    {:outliner-op :save-block}))))

(defn- handle-cardinality-changes [repo property-uuid property property-schema]
  ;; cardinality changed from :many to :one
  (if (and (= :one (:cardinality property-schema))
           (not= :one (:cardinality (:block/schema property))))
    (when (seq (model/get-block-property-values property-uuid))
      (notification/show! "Can't change a property's multiple values back to single if a property is used anywhere" :error)
      ::skip-transact)
    ;; cardinality changed from :one to :many
    (when (and (= :many (:cardinality property-schema))
               (not= :many (:cardinality (:block/schema property))))
      (fix-cardinality-many-values! repo property-uuid))))

(defn update-property!
  [repo property-uuid {:keys [property-name property-schema
                              properties]}]
  {:pre [(uuid? property-uuid)]}
  (when-let [property (db/entity [:block/uuid property-uuid])]
    (let [type (get-in property [:block/schema :type])
          type-changed? (and type (:type property-schema) (not= type (:type property-schema)))]
      (when (or (not type-changed?)
                ;; only change type if property hasn't been used yet
                (empty? (model/get-block-property-values property-uuid)))
        (when (not= ::skip-transact (handle-cardinality-changes repo property-uuid property property-schema))
          (let [tx-data (cond-> {:block/uuid property-uuid}
                          property-name (merge
                                         {:block/original-name property-name
                                          :block/name (gp-util/page-name-sanity-lc property-name)})
                          property-schema (assoc :block/schema
                                                 ;; a property must have a :type when making schema changes
                                                 (merge {:type :default}
                                                        property-schema))
                          properties (assoc :block/properties
                                            (merge (:block/properties property)
                                                   properties))
                          true outliner-core/block-with-updated-at)]
            (db/transact! repo [tx-data]
                          {:outliner-op :save-block})))))))

(defn class-add-property!
  [repo class-uuid k-name]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (contains? (:block/type class) "class")
      (let [k-name (name k-name)
            property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
            property-uuid (or (:block/uuid property) (db/new-block-id))
            property-type (get-in property [:block/schema :type])
            {:keys [properties] :as class-schema} (:block/schema class)
            _ (upsert-property! repo k-name
                                (cond-> (:block/schema property)
                                  (some? property-type)
                                  (assoc :type property-type))
                                {:property-uuid property-uuid})
            new-properties (vec (distinct (conj properties property-uuid)))
            class-new-schema (assoc class-schema :properties new-properties)]
        (db/transact! repo
                      [{:db/id (:db/id class)
                        :block/schema class-new-schema}]
                      {:outliner-op :save-block})))))

(defn class-remove-property!
  [repo class-uuid k-uuid]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (contains? (:block/type class) "class")
      (when-let [property (db/pull repo '[*] [:block/uuid k-uuid])]
        (let [property-uuid (:block/uuid property)
              {:keys [properties] :as class-schema} (:block/schema class)
              new-properties (vec (distinct (remove #{property-uuid} properties)))
              class-new-schema (assoc class-schema :properties new-properties)]
          (db/transact! repo [{:db/id (:db/id class)
                               :block/schema class-new-schema}]
                        {:outliner-op :save-block}))))))

(defn class-set-schema!
  [repo class-uuid schema]
  (when-let [class (db/entity repo [:block/uuid class-uuid])]
    (when (contains? (:block/type class) "class")
      (db/transact! repo [{:db/id (:db/id class)
                           :block/schema schema}]
                    {:outliner-op :save-block}))))

(defn batch-set-property!
  "Notice that this works only for properties with cardinality equals to `one`."
  [repo block-ids k-name v]
  (let [k-name (name k-name)
        property (db/entity repo [:block/name (gp-util/page-name-sanity-lc k-name)])
        property-uuid (or (:block/uuid property) (db/new-block-id))
        type (:type (:block/schema property))
        infer-schema (when-not type (infer-schema-from-input-string v))
        property-type (or type infer-schema :default)
        _ (when (nil? property)
            (upsert-property! repo k-name (assoc (:block/schema property) :type property-type)
                              {:property-uuid property-uuid}))
        {:keys [cardinality]} (:block/schema property)
        txs (mapcat
             (fn [id]
               (when-let [block (db/entity [:block/uuid id])]
                 (when (and (some? v) (not= cardinality :many))
                   (let [v* (try
                              (convert-property-input-string property-type v)
                              (catch :default e
                                (notification/show! (str e) :error false)
                                nil))
                         properties (:block/properties block)
                         block-properties (assoc properties property-uuid v*)
                         refs (outliner-core/rebuild-block-refs repo block block-properties)]
                     [[:db/retract (:db/id block) :block/refs]
                      {:block/uuid (:block/uuid block)
                       :block/properties block-properties
                       :block/refs refs}]))))
             block-ids)]
    (when (seq txs)
      (db/transact! repo txs {:outliner-op :save-block}))))

(defn batch-remove-property!
  [repo block-ids key]
  (when-let [property-uuid (if (uuid? key)
                             key
                             (db-pu/get-user-property-uuid repo key))]
    (let [txs (mapcat
               (fn [id]
                 (when-let [block (db/entity [:block/uuid id])]
                   (let [origin-properties (:block/properties block)]
                     (when (contains? (set (keys origin-properties)) property-uuid)
                       (let [properties' (dissoc origin-properties property-uuid)
                             refs (outliner-core/rebuild-block-refs repo block properties')
                             property (db/entity [:block/uuid property-uuid])
                             value (get origin-properties property-uuid)
                             block-value? (and (= :default (get-in property [:block/schema :type] :default))
                                               (uuid? value))
                             property-block (when block-value? (db/entity [:block/uuid value]))
                             retract-blocks-tx (when (and property-block
                                                          (some? (get-in property-block [:block/metadata :created-from-block]))
                                                          (some? (get-in property-block [:block/metadata :created-from-property])))
                                                 (let [txs-state (atom [])]
                                                   (outliner-core/delete-block txs-state
                                                                               (outliner-core/->Block property-block)
                                                                               {:children? true})
                                                   @txs-state))]
                         (concat
                          [[:db/retract (:db/id block) :block/refs]
                           {:block/uuid (:block/uuid block)
                            :block/properties properties'
                            :block/refs refs}]
                          retract-blocks-tx))))))
               block-ids)]
      (when (seq txs)
        (db/transact! repo txs {:outliner-op :save-block})))))

(defn remove-block-property!
  [repo block-id key]
  (let [k-name (if (uuid? key)
                 (:block/original-name (db/entity [:block/uuid key]))
                 (string/lower-case (name key)))]
    (if (contains? #{"alias" "tags"} k-name)
      (let [attribute (case k-name
                        "alias"
                        :block/alias
                        "tags"
                        :block/tags)
            block (db/entity [:block/uuid block-id])]
        (db/transact! repo
                      [[:db/retract (:db/id block) attribute]]
                      {:outliner-op :save-block}))
      (batch-remove-property! repo [block-id] key))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [repo block property-id property-value]
  (when (and block (uuid? property-id))
    (when (not= property-id (:block/uuid block))
      (when-let [property (db/pull [:block/uuid property-id])]
        (let [schema (:block/schema property)
              k-name (:block/name property)
              tags-or-alias? (and (contains? #{"tags" "alias"} k-name)
                                  (uuid? property-value))]
          (if tags-or-alias?
            (let [property-value-id (:db/id (db/entity [:block/uuid property-value]))
                  attribute (case k-name
                              "alias"
                              :block/alias
                              "tags"
                              :block/tags)]
              (when property-value-id
                (db/transact! repo
                              [[:db/retract (:db/id block) attribute property-value-id]]
                              {:outliner-op :save-block})))
            (if (= :many (:cardinality schema))
              (let [properties (:block/properties block)
                    properties' (update properties property-id
                                        (fn [col]
                                          (set (remove #{property-value} col))))
                    refs (outliner-core/rebuild-block-refs repo block properties')]
                (db/transact! repo
                              [[:db/retract (:db/id block) :block/refs]
                               {:block/uuid (:block/uuid block)
                                :block/properties properties'
                                :block/refs refs}]
                              {:outliner-op :save-block}))
              (if (= :default (get-in property [:block/schema :type]))
                (set-block-property! repo (:block/uuid block)
                                     (:block/original-name property)
                                     ""
                                     {})
                (remove-block-property! repo (:block/uuid block) property-id)))))))))

(defn replace-key-with-id
  "Notice: properties need to be created first"
  [m]
  (zipmap
   (map (fn [k]
          (if (uuid? k)
            k
            (let [property-id (db-pu/get-user-property-uuid k)]
             (when-not property-id
               (throw (ex-info "Property not exists yet"
                               {:key k})))
             property-id)))
        (keys m))
   (vals m)))

(defn collapse-expand-property!
  "Notice this works only if the value itself if a block (property type should be either :default or :template)"
  [repo block property collapse?]
  (let [f (if collapse? :db/add :db/retract)]
    (db/transact! repo
                  [[f (:db/id block) :block/collapsed-properties (:db/id property)]]
                  {:outliner-op :save-block})))

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

(defn- closed-value-other-position?
  [property-id block-properties]
  (and
   (some? (get block-properties property-id))
   (let [schema (:block/schema (db/entity [:block/uuid property-id]))]
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
     (seq (:block/alias properties))
     (and (seq properties)
          (not= (keys properties) [(db-pu/get-built-in-property-uuid :icon)])))))

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
                    :block/left (or (when page-entity (model/get-block-last-direct-child-id (db/get-db) (:db/id page-entity)))
                                    page-id)
                    :block/metadata metadata}
                   sqlite-util/block-with-timestamps)
        child-1-id (db/new-block-id)
        child-1 (-> {:block/uuid child-1-id
                     :block/format :markdown
                     :block/content value
                     :block/page page-id
                     :block/parent [:block/uuid parent-id]
                     :block/left [:block/uuid parent-id]}
                    sqlite-util/block-with-timestamps
                    parse-block)]
    {:page page-tx
     :blocks [parent child-1]}))

(defn create-property-text-block!
  [block property value parse-block {:keys [class-schema?]}]
  (let [repo (state/get-current-repo)
        {:keys [page blocks]} (property-create-new-block block property value parse-block)
        first-block (first blocks)
        last-block-id (:block/uuid (last blocks))
        class? (contains? (:block/type block) "class")
        property-key (:block/original-name property)]
    (db/transact! repo (if page (cons page blocks) blocks) {:outliner-op :insert-blocks})
    (when property-key
      (if (and class? class-schema?)
        (class-add-property! repo (:block/uuid block) property-key)
        (set-block-property! repo (:block/uuid block) property-key (:block/uuid first-block) {})))
    last-block-id))

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
                       :block/left (or (when page-entity (model/get-block-last-direct-child-id (db/get-db) (:db/id page-entity)))
                                       page-id)}
                      sqlite-util/block-with-timestamps)]
    {:page page-tx
     :blocks [new-block]}))

(defn- get-property-hidden-page
  [property]
  (let [page-name (str db-property-util/hidden-page-name-prefix (:block/uuid property))]
    (or (db/entity [:block/name page-name])
        (db-property-util/build-property-hidden-page property))))

(defn upsert-closed-value
  "id should be a block UUID or nil"
  [property {:keys [id value icon description]
             :or {description ""}}]
  (assert (or (nil? id) (uuid? id)))
  (let [property-type (get-in property [:block/schema :type] :default)]
    (when (contains? db-property-type/closed-value-property-types property-type)
      (let [property (db/entity (:db/id property))
            value (if (string? value) (string/trim value) value)
            property-schema (:block/schema property)
            closed-values (:values property-schema)
            block-values (map (fn [id] (db/entity [:block/uuid id])) closed-values)
            resolved-value (try
                             (convert-property-input-string (:type property-schema) value)
                             (catch :default e
                               (js/console.error e)
                               (notification/show! (str e) :error false)
                               nil))
            block (when id (db/entity [:block/uuid id]))
            value-block (when (uuid? value) (db/entity [:block/uuid value]))
            validate-message (validate-property-value
                              (get (built-in-validation-schemas property {:new-closed-value? true}) property-type)
                              resolved-value)]
        (cond
          (some (fn [b] (and (= resolved-value (or (db-pu/property-value-when-closed b)
                                                   (:block/uuid b)))
                             (not= id (:block/uuid b)))) block-values)
          (do
            (notification/show! "Choice already exists" :warning)
            :value-exists)

          validate-message
          (do
            (notification/show! validate-message :warning)
            :value-invalid)

          (nil? resolved-value)
          nil

          (:block/name value-block)             ; page
          (let [new-values (vec (conj closed-values value))]
            {:block-id value
             :tx-data [{:db/id (:db/id property)
                        :block/schema (assoc property-schema :values new-values)}]})

          :else
          (let [block-id (or id (db/new-block-id))
                icon-id (db-pu/get-built-in-property-uuid "icon")
                icon (when-not (and (string? icon) (string/blank? icon)) icon)
                description (string/trim description)
                description (when-not (string/blank? description) description)
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
                          (let [page (get-property-hidden-page property)
                                page-tx (when-not (e/entity? page) page)
                                page-id [:block/uuid (:block/uuid page)]
                                new-block (db-property-util/build-closed-value-block
                                           block-id resolved-value page-id property {:icon-id icon-id
                                                                                     :icon icon
                                                                                     :description description})
                                new-values (vec (conj closed-values block-id))]
                            (->> (cons page-tx [new-block
                                                {:db/id (:db/id property)
                                                 :block/schema (merge {:type property-type}
                                                                      (assoc property-schema :values new-values))}])
                                 (remove nil?))))]
            {:block-id block-id
             :tx-data tx-data}))))))

(defn add-existing-values-to-closed-values!
  "Adds existing values as closed values and returns their new block uuids"
  [property values]
  (when (seq values)
    (let [property-id (:block/uuid property)
          property-schema (:block/schema property)
          page (get-property-hidden-page property)
          page-tx (when-not (e/entity? page) page)
          page-id (:block/uuid page)
          closed-value-blocks (map (fn [value]
                                     (db-property-util/build-closed-value-block
                                      (db/new-block-id)
                                      value
                                      [:block/uuid page-id]
                                      property
                                      {}))
                                   (remove string/blank? values))
          value->block-id (zipmap
                           (map #(get-in % [:block/schema :value]) closed-value-blocks)
                           (map :block/uuid closed-value-blocks))
          new-value-ids (mapv :block/uuid closed-value-blocks)
          property-tx {:db/id (:db/id property)
                       :block/schema (assoc property-schema :values new-value-ids)}
          block-values (->> (model/get-block-property-values (:block/uuid property))
                            (remove #(uuid? (first %))))
          tx-data (concat
                   (when page-tx [page-tx])
                   closed-value-blocks
                   [property-tx]
                   (map (fn [[id value]]
                          (let [properties (:block/properties (db/entity id))]
                            (if (string/blank? value) ; remove blank property values
                              {:db/id id
                               :block/properties (dissoc properties property-id)}
                              {:db/id id
                               :block/properties (assoc properties property-id (get value->block-id value))})))
                        block-values))]
      (db/transact! (state/get-current-repo) tx-data
                    {:outliner-op :insert-blocks})
      new-value-ids)))

(defn delete-closed-value!
  [property value-block]
  (if (seq (:block/_refs value-block))
    (notification/show! "The choice can't be deleted because it's still used." :warning)
    (let [property (db/entity (:db/id property))
          schema (:block/schema property)
          tx-data [[:db/retractEntity (:db/id value-block)]
                   {:db/id (:db/id property)
                    :block/schema (update schema :values
                                          (fn [values]
                                            (vec (remove #{(:block/uuid value-block)} values))))}]]
      (db/transact! tx-data))))

(defn get-property-block-created-block
  "Get the root block and property that created this property block."
  [eid]
  (let [b (db/entity eid)
        parents (model/get-block-parents (state/get-current-repo) (:block/uuid b) {})
        {:keys [created-from-block created-from-property]}
        (some (fn [block]
                (let [metadata (:block/metadata block)
                      result (select-keys metadata [:created-from-block :created-from-property])]
                  (when (seq result)
                    result))) (reverse parents))
        from-block (when created-from-block (db/entity [:block/uuid created-from-block]))
        from-property (when created-from-property (db/entity [:block/uuid created-from-property]))]
    {:from-block-id (or (:db/id from-block) (:db/id b))
     :from-property-id (:db/id from-property)}))
