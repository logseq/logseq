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

(defn- date-str?
  [value]
  (when-let [d (js/Date. value)]
    (not= (str d) "Invalid Date")))

(defn- logseq-page?
  [id]
  (and (uuid? id)
       (when-let [e (db/entity [:block/uuid id])]
         (nil? (:block/page e)))))

(defn- logseq-block?
  [id]
  (and (uuid? id)
       (when-let [e (db/entity [:block/uuid id])]
         (some? (:block/page e)))))

(defn- logseq-object?
  [id]
  (and (uuid? id)
       (when-let [e (db/entity [:block/uuid id])]
         (seq (:block/class e)))))

(def builtin-schema-types
  {:default  string?                     ; refs/tags will not be extracted
   :number   number?
   :date     [:fn
              {:error/message "should be a date"}
              date-str?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              gp-util/url?]
   :page     [:fn
              {:error/message "should be a page"}
              logseq-page?]
   :block    [:fn
              {:error/message "should be a block"}
              logseq-block?]
   :object    [:fn
               {:error/message "should be an object"}
               logseq-object?]})

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

;; TODO: Enable or delete if unused
#_(def builtin-schema->type
    (set/map-invert builtin-schema-types))

(defn- infer-schema-from-input-string
  [v-str]
  (try
    (cond
      (parse-long v-str) :number
      (parse-double v-str) :number
      (util/uuid-string? v-str) :object
      (gp-util/url? v-str) :url
      (date-str? v-str) :date
      (contains? #{"true" "false"} (string/lower-case v-str)) :boolean
      :else :default)
    (catch :default _e
      :default)))

(defn convert-property-input-string
  [schema-type v-str]
  (if (and (not (string? v-str)) (not (object? v-str)))
    v-str
    (case schema-type
      :default
      v-str

      :number
      (edn/read-string v-str)

      :boolean
      (edn/read-string (string/lower-case v-str))

      :page
      (uuid v-str)

      :block
      (uuid v-str)

      :object
      (uuid v-str)

      :date
      (js/Date. v-str)                  ; inst

      :url
      v-str)))

(defn- upsert-property!
  [repo property k-name property-uuid property-type]
  (let [k-name (name k-name)]
    (when (and property (nil? (:block/type property)))
     (db/transact! repo [(outliner-core/block-with-updated-at
                          {:block/schema {:type property-type}
                           :block/uuid property-uuid
                           :block/type "property"})]
       {:outliner-op :update-property}))
    (when (nil? property) ;if property not exists yet
      (db/transact! repo [(outliner-core/block-with-timestamps
                           {:block/schema {:type property-type}
                            :block/original-name k-name
                            :block/name (util/page-name-sanity-lc k-name)
                            :block/uuid property-uuid
                            :block/type "property"})]
        {:outliner-op :create-new-property}))))

(defn add-property!
  [repo block k-name v {:keys [old-value]}]
  (let [k-name (name k-name)
        property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
        v (if property v (or v ""))]
    (when (some? v)
      (let [property-uuid (or (:block/uuid property) (random-uuid))
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
                   nil))]
        (when-not (contains? (if (set? value) value #{value}) v*)
          (if-let [msg (me/humanize (mu/explain-data schema v*))]
            (let [msg' (str "\"" k-name "\"" " " (if (coll? msg) (first msg) msg))]
              (notification/show! msg' :warning))
            (do
              (upsert-property! repo property k-name property-uuid property-type)
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
                                (set (remove string/blank? new-value))
                                new-value)
                    block-properties (assoc properties property-uuid new-value)
                    refs (outliner-core/rebuild-block-refs block block-properties)]
                ;; TODO: fix block/properties-order
                (db/transact! repo
                  [[:db/retract (:db/id block) :block/refs]
                   {:block/uuid (:block/uuid block)
                    :block/properties block-properties
                    :block/refs refs}]
                  {:outliner-op :add-property})))))))))

(defn remove-property!
  [repo block property-uuid]
  {:pre (string? property-uuid)}
  (let [origin-properties (:block/properties block)]
    (when (contains? (set (keys origin-properties)) property-uuid)
      (let [properties' (dissoc origin-properties property-uuid)
            refs (outliner-core/rebuild-block-refs block properties')]
        (db/transact!
         repo
          [[:db/retract (:db/id block) :block/refs]
           {:block/uuid (:block/uuid block)
            :block/properties properties'
            :block/refs refs}]
          {:outliner-op :remove-property})))))

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
        {:outliner-op :property-fix-cardinality}))))

(defn update-property!
  [repo property-uuid {:keys [property-name property-schema]}]
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
                    true outliner-core/block-with-updated-at)]
      (db/transact! repo [tx-data]
        {:outliner-op :update-property}))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [repo block property-id property-value]
  (when (and block (uuid? property-id))
    (when (not= property-id (:block/uuid block))
      (when-let [property (db/pull [:block/uuid property-id])]
        (let [schema (:block/schema property)]
          (when (= :many (:cardinality schema))
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
                {:outliner-op :delete-property-value})))
          (state/clear-edit!))))))

(defn class-add-property!
  [repo class k-name]
  (when (= "class" (:block/type class))
    (let [k-name (name k-name)
          property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
          property-uuid (or (:block/uuid property) (random-uuid))
          property-type (get-in property [:block/schema :type] :default)
          {:keys [properties] :as class-schema} (:block/schema class)
          _ (upsert-property! repo property k-name property-uuid property-type)
          new-properties (vec (distinct (conj properties property-uuid)))
          class-new-schema (assoc class-schema :properties new-properties)]
      (db/transact! repo
        [{:db/id (:db/id class)
          :block/schema class-new-schema}]
        {:outliner-op :class-add-property}))))

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
          {:outliner-op :class-remove-property})))))
