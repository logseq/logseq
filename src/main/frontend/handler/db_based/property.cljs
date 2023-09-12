(ns frontend.handler.db-based.property
  "Properties handler for db graphs"
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.notification :as notification]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [malli.util :as mu]
            [malli.error :as me]))

;; TODO:
;; Validate && list fixes for non-validated values when updating property schema

(defn- logseq-page?
  [id]
  (and (uuid? id)
       (when-let [e (db/entity [:block/uuid id])]
         (nil? (:block/page e)))))

(defn- text-or-uuid?
  [value]
  (or (string? value) (uuid? value)))

(def builtin-schema-types
  {:default  [:fn
              {:error/message "should be a text or UUID"}
              text-or-uuid?]                     ; refs/tags will not be extracted
   :number   number?
   :date     [:fn
              {:error/message "should be a journal date"}
              logseq-page?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              gp-util/url?]
   :page     [:fn
              {:error/message "should be a page"}
              logseq-page?]
   ;; internal usage
   :keyword  keyword?
   :map      map?
   ;; coll elements are ordered as it's saved as a vec
   :coll     coll?
   :any      some?})

(def internal-builtin-schema-types #{:keyword :map :coll :any})
(def user-face-builtin-schema-types [:default :number :date :checkbox :url :page])

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(defn- infer-schema-from-input-string
  [v-str]
  (try
    (cond
      (parse-long v-str) :number
      (parse-double v-str) :number
      (util/uuid-string? v-str) :page
      (gp-util/url? v-str) :url
      (contains? #{"true" "false"} (string/lower-case v-str)) :boolean
      :else :default)
    (catch :default _e
      :default)))

(defn convert-property-input-string
  [schema-type v-str]
  (if (and (not (string? v-str)) (not (object? v-str)))
    v-str
    (case schema-type
      (:default :any :url)
      (if (util/uuid-string? v-str) (uuid v-str) v-str)

      :number
      (edn/read-string v-str)

      :boolean
      (edn/read-string (string/lower-case v-str))

      :page
      (uuid v-str)

      :date
      v-str                  ; uuid
      )))

(defn upsert-property!
  [repo k-name schema {:keys [property-uuid]}]
  (let [property (db/entity [:block/name (gp-util/page-name-sanity-lc k-name)])
        k-name (name k-name)
        property-uuid (or (:block/uuid property) property-uuid (db/new-block-id))]
    (when (and property (nil? (:block/type property)))
      (db/transact! repo [(outliner-core/block-with-updated-at
                           {:block/schema schema
                            :block/uuid property-uuid
                            :block/type "property"})]
        {:outliner-op :save-block}))
    (when (nil? property) ;if property not exists yet
      (db/transact! repo [(outliner-core/block-with-timestamps
                           {:block/schema schema
                            :block/original-name k-name
                            :block/name (util/page-name-sanity-lc k-name)
                            :block/uuid property-uuid
                            :block/type "property"})]
        {:outliner-op :insert-blocks}))))

(defn set-block-property!
  [repo block-id k-name v {:keys [old-value]}]
  (let [block (db/entity repo [:block/uuid block-id])
        k-name (name k-name)
        property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
        v (if property v (or v ""))]
    (when (some? v)
      (let [property-uuid (or (:block/uuid property) (db/new-block-id))
            {:keys [type cardinality]} (:block/schema property)
            multiple-values? (= cardinality :many)
            infer-schema (when-not type (infer-schema-from-input-string v))
            property-type (or type infer-schema :default)
            schema (get builtin-schema-types property-type)
            properties (:block/properties block)
            value (get properties property-uuid)
            v* (try
                 (convert-property-input-string property-type v)
                 (catch :default e
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
                (upsert-property! repo k-name {:type property-type}
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
                      new-value (if (coll? new-value)
                                  (if (= :coll property-type)
                                    (vec (remove string/blank? new-value))
                                    (set (remove string/blank? new-value)))
                                  new-value)
                      block-properties (assoc properties property-uuid new-value)
                      refs (outliner-core/rebuild-block-refs block block-properties)]
                  (util/pprint [[:db/retract (:db/id block) :block/refs]
                                 {:block/uuid (:block/uuid block)
                                  :block/properties block-properties
                                  :block/refs refs}])
                  (db/transact! repo
                                [[:db/retract (:db/id block) :block/refs]
                                 {:block/uuid (:block/uuid block)
                                  :block/properties block-properties
                                  :block/refs refs}]
                                {:outliner-op :save-block}))))))))))

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
                    {:outliner-op :save-block}))))

(defn class-add-property!
  [repo class k-name]
  (when (= "class" (:block/type class))
    (let [k-name (name k-name)
          property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
          property-uuid (or (:block/uuid property) (db/new-block-id))
          property-type (get-in property [:block/schema :type] :default)
          {:keys [properties] :as class-schema} (:block/schema class)
          _ (upsert-property! repo k-name {:type property-type}
                              {:property-uuid property-uuid})
          new-properties (vec (distinct (conj properties property-uuid)))
          class-new-schema (assoc class-schema :properties new-properties)]
      (db/transact! repo
        [{:db/id (:db/id class)
          :block/schema class-new-schema}]
        {:outliner-op :save-block}))))

(defn class-remove-property!
  [repo class k-uuid]
  (when (= "class" (:block/type class))
    (when-let [property (db/pull repo '[*] [:block/uuid k-uuid])]
      (let [property-uuid (:block/uuid property)
            {:keys [properties] :as class-schema} (:block/schema class)
            new-properties (vec (distinct (remove #{property-uuid} properties)))
            class-new-schema (assoc class-schema :properties new-properties)]
        (db/transact! repo [{:db/id (:db/id class)
                             :block/schema class-new-schema}]
          {:outliner-op :save-block})))))

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
            (upsert-property! repo k-name {:type property-type}
                              {:property-uuid property-uuid}))
        {:keys [type cardinality]} (:block/schema property)
        property (db/entity repo [:block/name (gp-util/page-name-sanity-lc k-name)])
        txs (mapcat
             (fn [id]
               (when-let [block (db/entity [:block/uuid id])]
                 (when (and (some? v) (not= cardinality :many))
                   (let [schema (get builtin-schema-types property-type)
                         v* (try
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
                             (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc (name key))])))]
    (let [txs (mapcat
               (fn [id]
                 (when-let [block (db/entity [:block/uuid id])]
                   (let [origin-properties (:block/properties block)]
                     (when (contains? (set (keys origin-properties)) property-uuid)
                       (let [properties' (dissoc origin-properties property-uuid)
                             refs (outliner-core/rebuild-block-refs block properties')]
                         [[:db/retract (:db/id block) :block/refs]
                          {:block/uuid (:block/uuid block)
                           :block/properties properties'
                           :block/refs refs}])))))
               block-ids)]
      (when (seq txs)
        (db/transact! repo txs {:outliner-op :save-block})))))

(defn remove-block-property!
  [repo block-id key]
  (let [k-name (if (uuid? key)
                 (:block/original-name (db/entity [:block/uuid key]))
                 (name key))]
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
                    refs (outliner-core/rebuild-block-refs block properties')]
                (db/transact! repo
                  [[:db/retract (:db/id block) :block/refs]
                   {:block/uuid (:block/uuid block)
                    :block/properties properties'
                    :block/refs refs}]
                  {:outliner-op :save-block}))
              ;; remove block property if cardinality is not many
              (remove-block-property! repo (:block/uuid block) property-id))))))))

(defn replace-key-with-id!
  "Notice: properties need to be created first"
  [m]
  (zipmap
   (map (fn [k]
          (let [property-id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc (name k))]))]
            (when-not property-id
              (throw (ex-info "Property not exists yet"
                              {:key k})))
            property-id))
     (keys m))
   (vals m)))
