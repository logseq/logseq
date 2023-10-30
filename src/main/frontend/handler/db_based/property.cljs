(ns frontend.handler.db-based.property
  "Properties handler for db graphs"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.notification :as notification]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [malli.util :as mu]
            [malli.error :as me]
            [frontend.format.block :as block]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.handler.property.util :as pu]))

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(def builtin-schema-types
  "A frontend version of builtin-schema-types that adds the current database to
   schema fns"
  (into {}
        (map (fn [[property-type property-val-schema]]
               (if (db-property-type/property-types-with-db property-type)
                 (let [[_ schema-opts schema-fn] property-val-schema]
                   [property-type [:fn schema-opts #(schema-fn (db/get-db) %)]])
                 [property-type property-val-schema]))
             db-property-type/builtin-schema-types)))

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
      :default
      (if (util/uuid-string? v-str) (uuid v-str) v-str)

      :number
      (fail-parse-double v-str)

      :page
      (uuid v-str)

      ;; these types don't need to be translated. :date expects uuid and other
      ;; types usually expect text
      (:url :date :any)
      v-str)))

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
            schema (get builtin-schema-types property-type)
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
            (if-let [msg (some #(me/humanize (mu/explain-data schema %)) values')]
              (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
                (notification/show! msg' :warning))
              (do
                (upsert-property! repo k-name (assoc property-schema :type property-type)
                                  {:property-uuid property-uuid})
                (let [block-properties (assoc properties property-uuid values')
                      refs (outliner-core/rebuild-block-refs block block-properties)]
                  (db/transact! repo
                                [[:db/retract (:db/id block) :block/refs]
                                 {:block/uuid (:block/uuid block)
                                  :block/properties block-properties
                                  :block/refs refs}]
                                {:outliner-op :save-block}))))))))))

(defn resolve-tag
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
                schema (get builtin-schema-types property-type)
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
                (if-let [msg (me/humanize (mu/explain-data schema v*))]
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
                          refs (outliner-core/rebuild-block-refs block
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

(defn update-property!
  [repo property-uuid {:keys [property-name property-schema
                              properties]}]
  {:pre [(uuid? property-uuid)]}
  (when-let [property (db/entity [:block/uuid property-uuid])]
    (let [type (get-in property [:block/schema :type])]
      (when-not (and type (:type property-schema) (not= type (:type property-schema))) ; property type changed
        (when (and (= :many (:cardinality property-schema))
                   (not= :many (:cardinality (:block/schema property))))
          ;; cardinality changed from :one to :many
          (fix-cardinality-many-values! repo property-uuid))
        (let [tx-data (cond-> {:block/uuid property-uuid}
                        property-name (merge
                                       {:block/original-name property-name
                                        :block/name (gp-util/page-name-sanity-lc property-name)})
                        property-schema (assoc :block/schema property-schema)
                        properties (assoc :block/properties
                                          (merge (:block/properties property)
                                                 properties))
                        true outliner-core/block-with-updated-at)]
          (db/transact! repo [tx-data]
                        {:outliner-op :save-block}))))))

(defn class-add-property!
  [repo class k-name]
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
                    {:outliner-op :save-block}))))

(defn class-remove-property!
  [repo class k-uuid]
  (when (contains? (:block/type class) "class")
    (when-let [property (db/pull repo '[*] [:block/uuid k-uuid])]
      (let [property-uuid (:block/uuid property)
            {:keys [properties] :as class-schema} (:block/schema class)
            new-properties (vec (distinct (remove #{property-uuid} properties)))
            class-new-schema (assoc class-schema :properties new-properties)]
        (db/transact! repo [{:db/id (:db/id class)
                             :block/schema class-new-schema}]
          {:outliner-op :save-block})))))

(defn class-set-schema!
  [repo class schema]
  (when (contains? (:block/type class) "class")
    (db/transact! repo [{:db/id (:db/id class)
                         :block/schema schema}]
                  {:outliner-op :save-block})))

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
                         refs (outliner-core/rebuild-block-refs block block-properties)]
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
                             (pu/get-user-property-uuid repo key))]
    (let [txs (mapcat
               (fn [id]
                 (when-let [block (db/entity [:block/uuid id])]
                   (let [origin-properties (:block/properties block)]
                     (when (contains? (set (keys origin-properties)) property-uuid)
                       (let [properties' (dissoc origin-properties property-uuid)
                             refs (outliner-core/rebuild-block-refs block properties')
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
                              (cond-> [[:db/retract (:db/id block) attribute property-value-id]]
                                (and :block/tags (= 1 (count (:block/tags block))))
                                (conj [:db/retract (:db/id block) :block/type "object"]))
                              {:outliner-op :save-block})))
            (if (= :many (:cardinality schema))
              (let [properties (:block/properties block)
                    properties' (update properties property-id
                                        (fn [col]
                                          (set (remove #{property-value} col))))
                    refs (outliner-core/rebuild-block-refs block properties')]
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

(defn replace-key-with-id!
  "Notice: properties need to be created first"
  [m]
  (zipmap
   (map (fn [k]
          (if (uuid? k)
            k
            (let [property-id (pu/get-user-property-uuid k)]
             (when-not property-id
               (throw (ex-info "Property not exists yet"
                               {:key k})))
             property-id)))
        (keys m))
   (vals m)))

(defn collapse-expand-property!
  [repo block property collapse?]
  (let [f (if collapse? :db/add :db/retract)]
    (db/transact! repo
                  [[f (:db/id block) :block/collapsed-properties (:db/id property)]]
                  {:outliner-op :save-block})))
