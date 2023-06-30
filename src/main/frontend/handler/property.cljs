(ns frontend.handler.property
  "Block properties handler."
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.db :as db]
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
  {:default string?                     ; default, might be mixed with refs, tags
   :number  number?
   :date    inst?
   :boolean boolean?
   :url     uri?
   :object  uuid?})                     ; TODO: make sure block exists

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
    refs'))

(defn- infer-schema-from-input-string
  [v-str]
  (cond
    (parse-long v-str) :number
    (parse-double v-str) :number
    (util/uuid-string? v-str) :object
    (gp-util/url? v-str) :url
    (date-str? v-str) :date
    (contains? #{"true" "false"} (string/lower-case v-str)) :boolean
    :else :default))

(defn convert-property-input-string
  [schema-type v-str]
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
    (js/Date. v-str)

    :url
    (goog.Uri. v-str)))

(defn add-property!
  [repo block k-name v]
  (let [property      (db/pull repo '[*] [:block/name k-name])
        property-uuid (or (:block/uuid property) (random-uuid))
        existing-schema (:block/schema property)
        property-type (:type existing-schema)
        infer-schema (infer-schema-from-input-string v)
        property-type (or property-type infer-schema :default)
        schema (get builtin-schema-types property-type)]
    (when-let [v* (try
                    (convert-property-input-string property-type v)
                    (catch :default e
                      (notification/show! (str e) :error false)
                      nil))]
      (if-let [msg (me/humanize (mu/explain-data schema v*))]
        (notification/show! msg :error false)
        (do (when (nil? property) ;if property not exists yet
              (db/transact! repo [(outliner-core/block-with-timestamps
                                   {:block/schema {:type property-type}
                                    :block/original-name k-name
                                    :block/name (util/page-name-sanity-lc k-name)
                                    :block/uuid property-uuid
                                    :block/type "property"})]))
            (let [block-properties (assoc (:block/properties block)
                                          property-uuid
                                          (if (= property-type :default)
                                            (let [refs (extract-page-refs-from-prop-str-value v*)]
                                              (if (seq refs) (set refs) v*))
                                            v*))
                  block-properties-text-values
                  (if (= property-type :default)
                    (assoc (:block/properties-text-values block) property-uuid v*)
                    (dissoc (:block/properties-text-values block) property-uuid))]
              (outliner-tx/transact!
                {:outliner-op :save-block}
                (outliner-core/save-block!
                 {:block/uuid (:block/uuid block)
                  :block/properties block-properties
                  :block/properties-text-values block-properties-text-values}))))))))

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

(defn update-property!
  [repo property-uuid {:keys [property-name property-schema]}]
  {:pre [(uuid? property-uuid)]}
  (let [tx-data (cond-> {:block/uuid property-uuid}
                  property-name (assoc :block/name property-name)
                  property-schema (assoc :block/schema property-schema)
                  true outliner-core/block-with-updated-at)]
    (db/transact! repo [tx-data])))

(defn- extract-refs
  [entity properties]
  (let [property-values (->>
                         properties
                         (map (fn [[k v]]
                                (let [schema (:block/schema (db/pull [:block/uuid k]))
                                      object? (= (:type schema) :object)
                                      f (if object? page-ref/->page-ref identity)]
                                  (->> (if (coll? v)
                                         v
                                         [v])
                                       (map f)))))
                         (apply concat)
                         (filter string?))
        block-text (string/join " "
                                (cons
                                 (:block/content entity)
                                 property-values))
        ast-refs (gp-mldoc/get-references block-text (gp-mldoc/default-config :markdown))
        refs (map #(or (gp-block/get-page-reference % #{})
                       (gp-block/get-block-reference %)) ast-refs)
        refs' (->> refs
                   (remove string/blank?)
                   distinct)]
    (map #(if (util/uuid-string? %)
            [:block/uuid (uuid %)]
            (block/page-name->map % true)) refs')))

(comment
  (defn delete-property-value!
    "Delete value if a property has multiple values"
    [entity property-id property-value]
    (when (and entity (uuid? property-id))
      (when (not= property-id (:block/uuid entity))
        (when-let [property (db/pull [:block/uuid property-id])]
          (let [schema (:block/schema property)
                [success? property-value-or-error] (validate schema property-value)
                multiple-values? (:multiple-values? schema)]
            (when (and multiple-values? success?)
              (let [properties (:block/properties entity)
                    properties' (update properties property-id disj property-value-or-error)
                    refs (extract-refs entity properties')]
                (outliner-tx/transact!
                  {:outliner-op :save-block}
                  (outliner-core/save-block!
                   {:block/uuid (:block/uuid entity)
                    :block/properties properties'
                    :block/refs refs}))))
            (state/clear-editor-action!)
            (state/clear-edit!)))))))

(defn set-editing-new-property!
  [value]
  (state/set-state! :ui/new-property-input-id value))

(defn editing-new-property!
  []
  (set-editing-new-property! (state/get-edit-input-id))
  (state/clear-edit!))
