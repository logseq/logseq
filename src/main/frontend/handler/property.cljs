(ns frontend.handler.property
  "Block properties handler."
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
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
            [malli.core :as m]))

(def builtin-schema-types
  {:string-contains-refs :string        ;default
   :refs [:sequential :string]})

(def ^:private gp-mldoc-config (gp-mldoc/default-config :markdown))

(defn extract-page-refs-from-prop-str-value
  [str-v]
  (let [ast-refs (gp-mldoc/get-references str-v gp-mldoc-config)
        refs (map #(gp-block/get-page-reference % #{}) ast-refs)
        refs' (->> refs
                   (remove string/blank?)
                   distinct)]
    refs'))

(defn- is-type-x?
  [schema-ast x]
  (or (= x (:type schema-ast))
      (and (= :and (:type schema-ast))
           (some #(= x (:type %)) (:children schema-ast)))))

(defn- schema-base-type
  [schema]
  (when-let [ast (try (m/ast schema) (catch :default _))]
    (cond
      (is-type-x? ast :int)
      :int

      (is-type-x? ast :float)
      :float

      (is-type-x? ast :string)
      :string

      :else
      nil)))

(defn- infer-schema-from-input-string
  [v-str]
  (cond
    (parse-long v-str) :int
    (parse-double v-str) :float
    :else nil))

(defn convert-property-input-string
  [schema v-str]
  (case (schema-base-type schema)
    :string
    v-str

    (:int :float nil)
    (edn/read-string v-str)))

(defn add-property!
  [repo block k-name v]
  (let [property-class      (db/pull repo '[*] [:block/name k-name])
        property-class-uuid (or (:block/uuid property-class) (random-uuid))
        property-schema (:block/schema property-class)
        infer-schema (infer-schema-from-input-string v)
        property-schema (or property-schema infer-schema :string-contains-refs)
        schema (get builtin-schema-types property-schema property-schema)]
    (when-let [v* (try
                    (convert-property-input-string schema v)
                    (catch :default e
                      (notification/show! (str e) :error false)
                      nil))]
      (if-let [msg (malli.util/explain-data schema v*)]
        (notification/show! (str msg) :error false)
        (do (when (nil? property-class) ;if property-class not exists yet
              (db/transact! repo [{:block/schema property-schema
                                   :block/name k-name
                                   :block/uuid property-class-uuid
                                   :block/type "property"}]))
            (let [block-properties (assoc (:block/properties block)
                                          (str property-class-uuid)
                                          (if (= property-schema :string-contains-refs)
                                            (set (extract-page-refs-from-prop-str-value v*))
                                            v*))
                  block-properties-text-values
                  (if (= property-schema :string-contains-refs)
                    (assoc (:block/properties-text-values block) (str property-class-uuid) v*)
                    (dissoc (:block/properties-text-values block) (str property-class-uuid)))]
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


(defn update-property-class!
  [repo property-uuid {:keys [property-name property-schema]}]
  {:pre [(uuid? property-uuid)]}
  (let [tx-data (cond-> {:block/uuid property-uuid}
                  property-name (assoc :block/name property-name)
                  property-schema (assoc :block/schema property-schema))]
    (db/transact! repo [tx-data])))



(defn- extract-refs
  [entity properties]
  (let [property-values (->>
                         properties
                         (map (fn [[k v]]
                                (let [schema (:block/property-schema (db/pull [:block/uuid k]))
                                      object? (= (:type schema) "object")
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

(defn validate
  "Check whether the `value` validate against the `schema`."
  [schema value]
  (if (string/blank? value)
    [true value]
    (case (:type schema)
      "any" [true value]
      "number" (if-let [n (parse-double value)]
                 (let [[min-n max-n] [(:min schema) (:max schema)]
                       min-result (if min-n (>= n min-n) true)
                       max-result (if max-n (<= n max-n) true)]
                   (cond
                     (and min-result max-result)
                     [true n]

                     (false? min-result)
                     [false (str "the min value is " min-n)]

                     (false? max-result)
                     [false (str "the max value is " max-n)]

                     :else
                     n))
                 [false "invalid number"])
      "date" (if-let [result (js/Date. value)]
               (if (not= (str result) "Invalid Date")
                 [true value]
                 [false "invalid date"])
               [false "invalid date"])
      "url" (if (gp-util/url? value)
              [true value]
              [false "invalid URL"])
      "object" (let [page-name (or
                                (try
                                  (page-ref/get-page-name value)
                                  (catch :default _))
                                value)]
                 [true page-name]))))

(defn delete-property!
  [entity property-id]
  (when (and entity (uuid? property-id))
    (let [properties' (dissoc (:block/properties entity) property-id)
          refs (extract-refs entity properties')]
      (outliner-tx/transact!
        {:outliner-op :save-block}
        (outliner-core/save-block!
         {:block/uuid (:block/uuid entity)
          :block/properties properties'
          :block/refs refs})))))

(defn delete-property-value!
  "Delete value if a property has multiple values"
  [entity property-id property-value]
  (when (and entity (uuid? property-id))
    (when (not= property-id (:block/uuid entity))
      (when-let [property (db/pull [:block/uuid property-id])]
        (let [schema (:block/property-schema property)
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
          (state/clear-edit!))))))

(defn set-editing-new-property!
  [value]
  (state/set-state! :ui/new-property-input-id value))

(defn editing-new-property!
  []
  (set-editing-new-property! (state/get-edit-input-id))
  (state/clear-edit!))
