(ns frontend.handler.property
  "Block properties handler."
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.format.block :as block]
            [frontend.handler.notification :as notification]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [malli.util :as mu]
            [malli.core :as m]
            [malli.error :as me]))

(defn- date-str?
  [value]
  (when-let [d (js/Date. value)]
    (not= (str d) "Invalid Date")))

(def builtin-schema-types
  {:default  string?                     ; default, might be mixed with refs, tags
   :number   number?
   :date     [:fn
              {:error/message "should be a date"}
              date-str?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              gp-util/url?]
   :object   uuid?})                     ; TODO: make sure block exists

;; schema -> type, cardinality, object's class
;;           min, max -> string length, number range, cardinality size limit

(def builtin-schema->type
  (set/map-invert builtin-schema-types))

(def ^:private gp-mldoc-config (gp-mldoc/default-config :markdown))

(defn extract-page-refs-from-prop-str-value
  [str-v]
  (let [ast-refs (gp-mldoc/get-references str-v gp-mldoc-config)
        refs (map #(gp-block/get-page-reference % #{}) ast-refs)
        refs' (->> refs
                   (remove string/blank?)
                   distinct)]
    (-> (map #(if (util/uuid-string? %)
             {:block/uuid (uuid %)}
             (block/page-name->map % true)) refs')
        set)))

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
  (if (boolean? v-str)
    v-str
    (case schema-type
      :default
      v-str

      :number
      (edn/read-string v-str)

      :boolean
      (edn/read-string (string/lower-case v-str))

      :object
      (uuid v-str)

      :date
      (js/Date. v-str)                  ; inst

      :url
      v-str)))

(defn add-property!
  [repo block k-name v & {:keys [old-value]}]
  (let [property (db/pull repo '[*] [:block/name (gp-util/page-name-sanity-lc k-name)])
        v (if property v (or v ""))]
    (when (some? v)
      (prn :debug " add-property! " {:k k-name
                                     :v v})
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
              ;; FIXME: what if the block already have a block/type, e.g. whiteboard?
              (when (and property (nil? (:block/type property)))
                (db/transact! repo [(outliner-core/block-with-updated-at
                                     {:block/schema {:type property-type}
                                      :block/uuid property-uuid
                                      :block/type "property"})]))
              (when (nil? property) ;if property not exists yet
                (db/transact! repo [(outliner-core/block-with-timestamps
                                     {:block/schema {:type property-type}
                                      :block/original-name k-name
                                      :block/name (util/page-name-sanity-lc k-name)
                                      :block/uuid property-uuid
                                      :block/type "property"})]))
              (let [refs (when (= property-type :default) (extract-page-refs-from-prop-str-value v*))
                    refs' (when (seq refs)
                            (concat (:block/refs (db/pull [:block/uuid (:block/uuid block)]))
                                    refs))
                    v' (if (= property-type :default)
                         (if (seq refs) refs v*)
                         v*)
                    new-value (cond
                                (and multiple-values? old-value
                                     (not= old-value :frontend.components.property/new-value-placeholder))
                                (let [v (mapv (fn [x] (if (= x old-value) v' x)) value)]
                                  (if (contains? (set v) v')
                                    v
                                    (conj v v')))

                                multiple-values?
                                (vec (distinct (conj value v')))

                                :else
                                v')
                    new-value (if (coll? new-value)
                                (vec (remove string/blank? new-value))
                                new-value)
                    block-properties (assoc properties property-uuid new-value)
                    block-properties-text-values
                    (if (and (not multiple-values?) (= property-type :default))
                      (assoc (:block/properties-text-values block) property-uuid v*)
                      (dissoc (:block/properties-text-values block) property-uuid))]
                ;; TODO: fix block/properties-order
                (db/transact! repo
                  [{:block/uuid (:block/uuid block)
                    :block/properties block-properties
                    :block/properties-text-values block-properties-text-values
                    :block/refs refs'}])))))))))

(defn remove-property!
  [repo block k-uuid-or-builtin-k-name]
  {:pre (string? k-uuid-or-builtin-k-name)}
  (let [origin-properties (:block/properties block)]
    (assert (contains? (set (keys origin-properties)) k-uuid-or-builtin-k-name))
    (db/transact!
      repo
      [{:block/uuid (:block/uuid block)
        :block/properties (dissoc origin-properties k-uuid-or-builtin-k-name)
        :block/properties-text-values (dissoc (:block/properties-text-values block) k-uuid-or-builtin-k-name)}])))

(defn- fix-cardinality-many-values!
  [property-uuid]
  (let [ev (->> (model/get-block-property-values property-uuid)
                (remove (fn [[_ v]] (coll? v))))
        tx-data (map (fn [[e v]]
                       (let [entity (db/entity e)
                             properties (:block/properties entity)]
                         {:db/id e
                          :block/properties (assoc properties property-uuid [v])})) ev)]
    (when (seq tx-data)
      (db/transact! tx-data))))

(defn update-property!
  [repo property-uuid {:keys [property-name property-schema]}]
  {:pre [(uuid? property-uuid)]}
  (when-let [property (db/entity [:block/uuid property-uuid])]
    (when (and (= :many (:cardinality property-schema))
               (not= :many (:cardinality (:block/schema property))))
      ;; cardinality changed from :one to :many
      (fix-cardinality-many-values! property-uuid))
    (let [tx-data (cond-> {:block/uuid property-uuid}
                    property-name (merge
                                   {:block/original-name property-name
                                    :block/name (gp-util/page-name-sanity-lc property-name)})
                    property-schema (assoc :block/schema property-schema)
                    true outliner-core/block-with-updated-at)]
      (db/transact! repo [tx-data]))))

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
                                        (vec (remove #{property-value} col))))]
              (outliner-tx/transact!
                {:outliner-op :save-block}
                (outliner-core/save-block!
                 {:block/uuid (:block/uuid block)
                  :block/properties properties'}))))
          (state/clear-edit!))))))

(defn set-editing-new-property!
  [value]
  (state/set-state! :ui/new-property-input-id value))

(defn editing-new-property!
  []
  (set-editing-new-property! (state/get-edit-input-id))
  (state/clear-edit!))
