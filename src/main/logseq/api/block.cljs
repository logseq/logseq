(ns logseq.api.block
  "Block related apis"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.sdk.utils :as sdk-utils]))

(defn sanitize-user-property-name
  [k]
  (if (string? k)
    (-> k (string/trim)
        (string/replace " " "")
        (string/replace #"^[:_\s]+" "")
        (#(cond-> %
            (not (string/includes? % "/"))
            (string/lower-case))))
    k))

(defn resolve-property-prefix-for-db
  [^js plugin]
  (->> (when (some-> js/window.LSPlugin (.-PluginLocal))
         (or (some->> plugin (.-id) (sanitize-user-property-name) (str "."))
             "._api"))
       (str "plugin.property")))

(defn get-db-ident-from-property-name
  "Finds a property :db/ident for a given property name"
  [property-name plugin]
  (let [property-name' (if (string? property-name)
                         (keyword property-name)
                         property-name)]
    (if (qualified-keyword? property-name')
      property-name'
      ;; plugin property
      (let [plugin-ns "plugin.property._api"]
        (keyword plugin-ns (db-ident/normalize-ident-name-part property-name))))))

(defn plugin-property-key?
  [ident]
  (and (qualified-keyword? ident)
       (string/starts-with? (namespace ident) "plugin.property.")))

(defn into-readable-db-properties
  [properties]
  (some-> properties
          (db-pu/readable-properties
           {:original-key? true :key-fn str})))

(defn- entity->map
  [e]
  (assoc (into {} e) :db/id (:db/id e)))

(defn into-properties
  ([block] (into-properties (state/get-current-repo) block))
  ([repo block]
   (if (some-> repo (config/db-based-graph?))
     (let [e (db/entity (:db/id block))
           props (-> (:block/properties e)
                     sdk-utils/remove-hidden-properties)]
       (-> (entity->map block)
           (assoc :block/properties props)))
     block)))

(defn parse-property-json-value-if-need
  [ident property-value]
  (when-let [prop (and (string? property-value)
                       (plugin-property-key? ident)
                       (some-> ident (db-utils/entity)))]
    (if (= (:logseq.property/type prop) :string)
      (try
        (js/JSON.parse property-value)
        (catch js/Error _e
          property-value))
      property-value)))

(defn ensure-property-access-control
  "Plugin should only upsert its own properties"
  [property-ident property-name]
  (when-not (plugin-property-key? property-ident)
    ;; FIXME: ensure a plugin doesn't upsert other plugin's properties
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

;; TODO:
;; 1. infer type when property doesn't exists yet
;; 2. infer cardinality
(defn- set-block-properties!
  [block-id properties]
  (ui-outliner-tx/transact!
   {:outliner-op :set-block-properties}
   (doseq [[property-id property-ident value schema] properties]
     (when-not (qualified-keyword? property-ident)
       (throw (ex-info "Invalid property id" {:property-id property-id
                                              :property-ident property-ident})))
     (let [property (db/entity property-ident)
           property-type (or (:logseq.property/type property)
                             (some-> (:type schema) keyword))
           cardinality (or (:db/cardinality property)
                           (if (= "many" (:cardinality schema))
                             :db.cardinality/many
                             :db.cardinality/one))
           error-data {:property-id property-id
                       :property-ident property-ident
                       :schema schema
                       :value value}
           schema' {:logseq.property/type property-type
                    :db/cardinality cardinality}
           many? (= cardinality :db.cardinality/many)
           value' (if (and many? (not (coll? value)))
                    (when value [value])
                    value)]

       (when (and property schema)
         (throw (ex-info "Use `upsert_property` to modify existing property's schema"
                         error-data)))

       (when-not property-type
         (throw (ex-info (str "Missing `type` in schema for property: " property-id)
                         error-data)))

       (when (and (not many?) (coll? value))
         (throw (ex-info (util/format "Property %s has cardinality `one` but passed multiple values" property-id)
                         error-data)))

       (when-not property
         (ensure-property-access-control property-ident property-id)
         (outliner-op/upsert-property! property-ident schema' {:property-name property-id}))

       (when (and property (or many? (nil? value'))) ; delete property from this block
         (outliner-op/remove-block-property! block-id property-ident))

       (let [set-property! (fn [value]
                             (outliner-op/set-block-property! block-id property-ident
                                                              (convert-json-and-string property-type value)))
             values (if (coll? value') value' [value'])]
         (doseq [value values]
           (set-property! value)))))))

(defn db-based-save-block-properties!
  ([block properties & {:keys [plugin schema]}]
   (when-let [block-id (and (seq properties) (:db/id block))]
     (let [properties (->> properties
                           (map (fn [[k v]]
                                  (let [ident (get-db-ident-from-property-name k plugin)
                                        property-schema (get schema k)]
                                    [k ident v property-schema]))))]
       (set-block-properties! block-id properties)))))

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
                                  (db/get-block-immediate-children repo uuid))))
              block (into-properties repo block)]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
