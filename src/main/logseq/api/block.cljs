(ns logseq.api.block
  "Block related apis"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.sdk.utils :as sdk-utils]))

(def plugin-property-prefix "plugin.property.")
(def plugin-class-prefix "plugin.class.")

(defn sanitize-user-property-name
  [k]
  (if (string? k)
    (-> k (string/trim)
        (string/replace " " "")
        (string/replace #"^[:_\s]+" ""))
    (str k)))

(defn get-sanitized-plugin-id
  [^js plugin]
  (or
   (when (some-> js/window.LSPlugin (.-PluginLocal))
     (some->> plugin (.-id) sanitize-user-property-name))
   "_test_plugin"))

(defn resolve-property-prefix-for-db
  [^js plugin]
  (let [plugin-id (get-sanitized-plugin-id plugin)]
    (when-not plugin-id
      (js/console.error "Can't get current plugin id")
      (throw (ex-info "Can't get current plugin id"
                      {:plugin plugin})))
    (str plugin-property-prefix plugin-id)))

(defn get-db-ident-from-property-name
  "Finds a property :db/ident for a given property name"
  [property-name plugin]
  (let [property-name' (->
                        (if-not (string? property-name)
                          (str property-name)
                          property-name)
                        (string/replace #"^:+" ""))
        property-key (keyword property-name')]
    (if (qualified-keyword? property-key)
      property-key
      ;; plugin property
      (let [plugin-ns (resolve-property-prefix-for-db plugin)]
        (keyword plugin-ns (db-ident/normalize-ident-name-part property-name'))))))

(defn resolve-class-prefix-for-db
  [^js plugin]
  (let [plugin-id (get-sanitized-plugin-id plugin)]
    (when-not plugin-id
      (js/console.error "Can't get current plugin id")
      (throw (ex-info "Can't get current plugin id"
                      {:plugin plugin})))
    (str plugin-class-prefix plugin-id)))

(defn plugin-property-key?
  [ident]
  (and (qualified-keyword? ident)
       (string/starts-with? (namespace ident) plugin-property-prefix)))

(defn into-readable-db-properties
  [properties]
  (some-> properties
          (db-pu/readable-properties
           {:original-key? true :key-fn str})))

(defn parse-property-json-value-if-need
  [ident property-value]
  (when-let [prop (and (string? property-value)
                       (plugin-property-key? ident)
                       (some-> ident (db-utils/entity)))]
    (if (= (:logseq.property/type prop) :json)
      (try
        (js/JSON.parse property-value)
        (catch js/Error _e
          property-value))
      property-value)))

(defn ensure-property-upsert-control
  "Plugin should only upsert its own properties"
  [plugin property-ident property-name]
  (when-not (= (resolve-property-prefix-for-db plugin)
               (namespace property-ident))
    (throw (ex-info "Plugins can only upsert its own properties"
                    {:property property-name
                     :property-ident property-ident}))))

(defn- convert-json-and-string
  [property-type value]
  (cond
    (and (= :json property-type) (not (string? value)))
    (js/JSON.stringify (bean/->js value))

    (and (= :string property-type) (not (string? value)))
    (str value)

    :else
    value))

(defn- infer-property-type
  [value]
  (cond
    (boolean? value) :checkbox
    (or (number? value)
        (and (sequential? value) (every? number? value))) :number
    (or (db-property-type/url? value)
        (and (sequential? value) (every? db-property-type/url? value))) :url
    (map? value) :json
    :else :default))

(defn- set-block-properties!
  [plugin block-id properties {:keys [reset-property-values]}]
  (ui-outliner-tx/transact!
   {:outliner-op :set-block-properties}
   (doseq [[property-id property-ident value schema] properties]
     (when-not (qualified-keyword? property-ident)
       (js/console.error (str "Invalid property id: " property-id))
       (throw (ex-info "Invalid property id" {:property-id property-id
                                              :property-ident property-ident})))
     (let [property (db/entity property-ident)
           property-type (or (:logseq.property/type property)
                             (some-> (:type schema) keyword)
                             (and (nil? property)
                                  (infer-property-type value)))
           cardinality (or (:db/cardinality property)
                           (if (and (or (= "many" (:cardinality schema))
                                        (sequential? value))
                                    (not= (:cardinality schema) "one"))
                             :db.cardinality/many
                             :db.cardinality/one))
           _ (when (and (= cardinality :many) (= property-type :json))
               (throw (ex-info ":json type doesn't support multiple values" {:property-id property-ident})))
           error-data {:property-id property-id
                       :property-ident property-ident
                       :schema schema
                       :value value}
           schema' {:logseq.property/type property-type
                    :db/cardinality cardinality}
           many? (= cardinality :db.cardinality/many)
           value' (if (and many? (not (sequential? value)))
                    (when value [value])
                    value)]

       (when (and property schema)
         (throw (ex-info "Use `upsert_property` to modify existing property's schema"
                         error-data)))

       (when-not property-type
         (throw (ex-info (str "Missing `type` in schema for property: " property-id)
                         error-data)))

       (when (and (not many?) (sequential? value))
         (throw (ex-info (util/format "Property %s has cardinality `one` but passed multiple values" property-id)
                         error-data)))

       (when-not property
         (ensure-property-upsert-control plugin property-ident property-id)
         (outliner-op/upsert-property! property-ident schema' {:property-name property-id}))

       (when (and property (or (and many? reset-property-values) (nil? value'))) ; delete property from this block
         (outliner-op/remove-block-property! block-id property-ident))

       (let [set-property! (fn [value]
                             (outliner-op/set-block-property! block-id property-ident
                                                              (convert-json-and-string property-type value)))
             values (if (sequential? value') value' [value'])]
         (doseq [value values]
           (set-property! value)))))))

(defn db-based-save-block-properties!
  [block properties & {:keys [plugin schema reset-property-values]}]
  (when-let [block-id (and (seq properties) (:db/id block))]
    (let [properties (->> properties
                          (map (fn [[k v]]
                                 (let [ident (get-db-ident-from-property-name k plugin)
                                       property-schema (get schema k)]
                                   [k ident v property-schema]))))]
      (set-block-properties! plugin block-id properties {:reset-property-values reset-property-values}))))

(defn <sync-children-blocks!
  [block]
  (when block
    (db-async/<get-block (state/get-current-repo)
                         (:block/uuid (:block/parent block)) {:children? true})))

(defn get_block
  [id-or-uuid ^js opts]
  (when-let [block (if (number? id-or-uuid)
                     (db-utils/pull id-or-uuid)
                     (and id-or-uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error id-or-uuid))))]
    (when (or (true? (some-> opts (.-includePage)))
              (not (contains? block :block/name)))
      (when-let [uuid (:block/uuid block)]
        (let [{:keys [includeChildren]} (bean/->clj opts)
              repo (state/get-current-repo)
              block (if includeChildren
                      ;; nested children results
                      (let [blocks (->> (db-model/get-block-and-children repo uuid)
                                        (map (fn [b]
                                               (dissoc (db-utils/pull (:db/id b)) :block.temp/load-status))))]
                        (first (outliner-tree/blocks->vec-tree blocks uuid)))
                      ;; attached shallow children
                      (assoc block :block/children
                             (map #(list :uuid (:block/uuid %))
                                  (db/get-block-immediate-children repo uuid))))]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
