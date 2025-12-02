(ns logseq.api.db-based
  "DB version related fns"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn -get-property
  [^js plugin k]
  (when-let [k' (and (string? k) (api-block/sanitize-user-property-name k))]
    (let [property-ident (api-block/get-db-ident-from-property-name k' plugin)]
      (db/entity property-ident))))

(defn get-favorites
  []
  (p/let [favorites (page-handler/get-favorites)]
    (sdk-utils/result->js favorites)))

(defn insert-batch-blocks
  [this target blocks opts]
  (let [blocks' (walk/prewalk
                 (fn [f]
                   (if (and (map? f) (:content f) (nil? (:uuid f)))
                     (assoc f :uuid (d/squuid))
                     f))
                 blocks)
        {:keys [sibling before schema]} opts
        block (if before
                (db/pull (:db/id (ldb/get-left-sibling (db/entity (:db/id target))))) target)
        sibling? (if (common-entity-util/page? block) false sibling)
        uuid->properties (let [blocks (outliner-core/tree-vec-flatten blocks' :children)]
                           (when (some (fn [b] (seq (:properties b))) blocks)
                             (zipmap (map :uuid blocks)
                                     (map :properties blocks))))]
    (p/let [result (editor-handler/insert-block-tree-after-target
                    (:db/id block) sibling? blocks' :markdown true)
            blocks (:blocks result)]
      (when (seq blocks)
        (p/doseq [block blocks]
          (let [id (:block/uuid block)
                b (db/entity [:block/uuid id])
                properties (when uuid->properties (uuid->properties id))]
            (when (seq properties)
              (api-block/db-based-save-block-properties! b properties {:plugin this
                                                                       :schema schema})))))
      (let [blocks' (map (fn [b] (db/entity [:block/uuid (:block/uuid b)])) blocks)]
        (sdk-utils/result->js blocks')))))

(defn insert-block
  [this content properties schema opts]
  (p/let [new-block (editor-handler/api-insert-new-block! content opts)]
    (when (seq properties)
      (api-block/db-based-save-block-properties! new-block properties {:plugin this
                                                                       :schema schema}))
    (let [block (db/entity [:block/uuid (:block/uuid new-block)])]
      (sdk-utils/result->js block))))

(defn update-block
  [this block content opts]
  (when block
    (let [repo (state/get-current-repo)
          block-uuid (:block/uuid block)]
      (p/do!
       (when (seq (:properties opts))
         (api-block/db-based-save-block-properties! block (:properties opts)
                                                    {:plugin this
                                                     :schema (:schema opts)
                                                     :reset-property-values (:reset-property-values opts)}))
       (editor-handler/save-block! repo
                                   (sdk-utils/uuid-or-throw-error block-uuid) content
                                   (dissoc opts :properties))))))

(defn get-property
  [k]
  (this-as this
           (p/let [prop (-get-property this k)
                   prop' (some-> prop
                                 (assoc :type (:logseq.property/type prop)))]
             (sdk-utils/result->js prop'))))

(defn ->cardinality
  [input]
  (let [valid-input #{"one" "many" "db.cardinality/one" "db.cardinality/many"}]
    (when-not (contains? valid-input input)
      (throw (ex-info "Invalid cardinality, choices: \"one\" or \"many\"" {:input input})))
    (let [result (keyword input)]
      (case result
        :one :db.cardinality/one
        :many :db.cardinality/many
        result))))

(defn- schema-type-check!
  [type]
  (let [valid-types #{:default :number :date :datetime :checkbox :url :node :json :string}]
    (when-not (contains? valid-types type)
      (throw (ex-info (str "Invalid type, type should be one of: " valid-types) {:type type})))))

(defn- upsert-property-aux
  [this k schema opts]
  (p/let [k' (api-block/sanitize-user-property-name k)
          property-ident (api-block/get-db-ident-from-property-name k' this)
          _ (api-block/ensure-property-upsert-control this property-ident k')
          schema (or (some-> schema
                             (update-keys #(if (contains? #{:hide :public} %)
                                             (keyword (str (name %) "?")) %)))
                     {})
          _ (when (:type schema)
              (schema-type-check! (keyword (:type schema))))
          schema (cond-> schema
                   (string? (:cardinality schema))
                   (-> (assoc :db/cardinality (->cardinality (:cardinality schema)))
                       (dissoc :cardinality))

                   (string? (:type schema))
                   (-> (assoc :logseq.property/type (keyword (:type schema)))
                       (dissoc :type)))
          p (db-property-handler/upsert-property! property-ident schema
                                                  (assoc opts :property-name k'))]
    (db/entity (:db/id p))))

(defn upsert-property
  "schema:
    {:type :default | :number | :date | :datetime | :checkbox | :url | :node | :json | :string
     :cardinality :many | :one
     :hide? true
     :view-context :page
     :public? false}
  "
  [k ^js schema ^js opts]
  (this-as
   this
   (when-not (string/blank? k)
     (p/let [opts' (or (some-> opts bean/->clj) {})
             schema' (or (some-> schema bean/->clj) {})
             property (upsert-property-aux this k schema' opts')]
       (sdk-utils/result->js property)))))

(defn remove-property
  [k]
  (this-as
   this
   (p/let [property (-get-property this k)]
     (when-let [uuid (and (api-block/plugin-property-key? (:db/ident property))
                          (:block/uuid property))]
       (page-common-handler/<delete! uuid nil nil)))))

(defn upsert-block-property
  [this block key' value {:keys [schema reset-property-values]}]
  (let [opts {:plugin this
              :schema (when schema
                        {key schema})
              :reset-property-values reset-property-values}]
    (api-block/db-based-save-block-properties! block {key' value} opts)))

(defn get-all-tags
  []
  (-> (db-model/get-all-classes (state/get-current-repo)
                                {:except-root-class? true})
      sdk-utils/result->js))

(defn get-all-properties
  []
  (-> (ldb/get-all-properties (db/get-db))
      sdk-utils/result->js))

(defn get-tag-objects
  [class-uuid-or-ident-or-title]
  (let [eid (if (util/uuid-string? class-uuid-or-ident-or-title)
              (when-let [id (sdk-utils/uuid-or-throw-error class-uuid-or-ident-or-title)]
                [:block/uuid id])
              (let [k (keyword (api-block/sanitize-user-property-name class-uuid-or-ident-or-title))]
                (if (qualified-keyword? k)
                  k
                  (ldb/get-case-page (db/get-db) class-uuid-or-ident-or-title))))
        class (db/entity eid)]
    (when-not (ldb/class? class)
      (throw (ex-info "Not a tag" {:input class-uuid-or-ident-or-title})))
    (if-not class
      (throw (ex-info (str "Tag not exists with id: " eid) {}))
      (p/let [result (state/<invoke-db-worker :thread-api/get-class-objects
                                              (state/get-current-repo)
                                              (:db/id class))]
        (sdk-utils/result->js result)))))

(defn create-tag [title ^js opts]
  (this-as
    this
    (when-not (string? title)
      (throw (ex-info "Tag title should be a string" {:title title})))
    (when (string/blank? title)
      (throw (ex-info "Tag title shouldn't be empty" {:title title})))
    (when (text/namespace-page? title)
      (throw (ex-info "Tag title shouldn't include forward slash" {:title title})))
    (let [opts (bean/->clj opts)
          opts' (assoc opts
                  :redirect? false
                  :class-ident-namespace (api-block/resolve-class-prefix-for-db this))]
      (p/let [tag (db-page-handler/<create-class! title opts')]
        (sdk-utils/result->js tag)))))

(defn get-tag [class-uuid-or-ident-or-title]
  (this-as
    this
    (let [title-or-ident (-> (if-not (string? class-uuid-or-ident-or-title)
                               (str class-uuid-or-ident-or-title)
                               class-uuid-or-ident-or-title)
                           (string/replace #"^:+" ""))
          eid (if (text/namespace-page? title-or-ident)
                (keyword title-or-ident)
                (if (util/uuid-string? title-or-ident)
                  (when-let [id (sdk-utils/uuid-or-throw-error title-or-ident)]
                    [:block/uuid id])
                  (keyword (api-block/resolve-class-prefix-for-db this) title-or-ident)))
          tag (db/entity eid)]
      (when (ldb/class? tag)
        (sdk-utils/result->js tag)))))

(defn tag-add-property [tag-id property-id-or-name]
  (p/let [tag (db/get-case-page tag-id)
          property (db/get-case-page property-id-or-name)]
    (when-not (ldb/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
    (when-not (ldb/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
    (when (and (not (ldb/public-built-in-property? property))
               (ldb/built-in? property))
      (throw (ex-info "This is a private built-in property that can't be used." {:value property})))
    (p/do!
     (db-property-handler/class-add-property! (:db/id tag) (:db/ident property))
     (sdk-utils/result->js (db/get-case-page tag-id)))))

(defn tag-remove-property [tag-id property-id-or-name]
  (p/let [tag (db/get-case-page tag-id)
          property (db/get-case-page property-id-or-name)]
    (when-not (ldb/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
    (when-not (ldb/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
    (p/do!
     (db-property-handler/class-remove-property! (:db/id tag) (:db/ident property))
     (sdk-utils/result->js (db/get-case-page tag-id)))))

(defn add-block-tag [id-or-name tag-id]
  (p/let [repo (state/get-current-repo)
          tag (db-async/<get-block repo tag-id)
          block (db-async/<get-block repo id-or-name)]
    (when (and tag block)
      (db-page-handler/add-tag repo (:db/id block) tag))))

(defn remove-block-tag [id-or-name tag-id]
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo id-or-name)
          tag (db-async/<get-block repo tag-id)]
    (when (and block tag)
      (db-property-handler/delete-property-value!
       (:db/id block) :block/tags (:db/id tag)))))
