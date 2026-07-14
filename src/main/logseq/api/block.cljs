(ns logseq.api.block
  "Block related apis"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

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
  (if (and (string? property-value)
           (plugin-property-key? ident))
    (p/let [prop (db-async/<get-block (state/get-current-repo) ident {:children? false})]
      (if (= (:logseq.property/type prop) :json)
        (try
          (js/JSON.parse property-value)
          (catch js/Error _e
            property-value))
        property-value))
    property-value))

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
  [plugin block-id properties {:keys [page-id reset-property-values]}]
  (ui-outliner-tx/transact!
   {:outliner-op :set-block-properties
    :ui/page-id page-id}
   (doseq [[property-id property-ident value schema property] properties]
     (when-not (qualified-keyword? property-ident)
       (js/console.error (str "Invalid property id: " property-id))
       (throw (ex-info "Invalid property id" {:property-id property-id
                                              :property-ident property-ident})))
     (let [property-type (or (:logseq.property/type property)
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
  [block properties & {:keys [page-id plugin schema reset-property-values]}]
  (when-let [block-id (and (seq properties) (:block/uuid block))]
    (let [properties (mapv (fn [[k v]]
                             (let [ident (get-db-ident-from-property-name k plugin)
                                   property-schema (get schema k)]
                               [k ident v property-schema]))
                           properties)
          property-idents (mapv second properties)]
      (p/let [property-results (db-async/<get-blocks (state/get-current-repo)
                                                     property-idents
                                                     {:children? false})
              property-by-ident (into {}
                                      (keep (fn [{:keys [id block]}]
                                              (when block [id block])))
                                      property-results)
              properties (mapv (fn [[property-id ident value property-schema]]
                                 [property-id ident value property-schema (get property-by-ident ident)])
                               properties)]
        (set-block-properties! plugin block-id properties {:page-id page-id
                                                           :reset-property-values reset-property-values})))))

(defn <sync-children-blocks!
  [block]
  (when block
    (p/let [parent (db-async/<get-block-parent (state/get-current-repo) (:block/uuid block))]
      (when-let [parent-uuid (:block/uuid parent)]
        (db-async/<get-block (state/get-current-repo) parent-uuid {:children? true})))))

(defn- immediate-children
  [block children]
  (filter #(= (:db/id block) (get-in % [:block/parent :db/id])) children))

(defn- compact-normalized-refs
  [block]
  (cond-> block
    (contains? block "refs")
    (update "refs" #(mapv (fn [ref] (select-keys ref ["id"])) %))

    (:refs block)
    (update :refs #(mapv (fn [ref] (select-keys ref [:id])) %))))

(defn get_block
  [id-or-uuid ^js opts]
  (when id-or-uuid
    (p/let [{:keys [includeChildren]} (bean/->clj opts)
            repo (state/get-current-repo)
            id (cond
                 (number? id-or-uuid) id-or-uuid
                 (uuid? id-or-uuid) id-or-uuid
                 :else (sdk-utils/uuid-or-throw-error id-or-uuid))
            {:keys [block children]} (db-async/<get-block-with-children repo id {:children? true})]
      (when (and block
                 (or (true? (some-> opts (.-includePage)))
                     (not (contains? block :block/name))))
        (let [block (if includeChildren
                      (-> (outliner-tree/blocks->vec-tree (cons block children) (:block/uuid block))
                          first)
                      (assoc block :block/children
                             (map #(list :uuid (:block/uuid %))
                                 (immediate-children block children))))]
          (bean/->js (compact-normalized-refs
                      (sdk-utils/normalize-keyword-for-json block))))))))
