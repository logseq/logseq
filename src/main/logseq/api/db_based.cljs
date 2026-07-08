(ns logseq.api.db-based
  "DB version related fns"
  (:require ["@emoji-mart/data" :as emoji-data]
            [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.db.async :as db-async]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.entity :as entity]
            [goog.object :as gobj]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.graph-parser.text :as text]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defonce ^:private name->emoji
  (->> (vals (bean/->clj (gobj/get emoji-data "emojis")))
       (group-by :name)))

(defn- <get-block
  [id]
  (db-async/<get-block (state/get-current-repo) id {:children? false}))

(defn -get-property
  [^js plugin k]
  (when-let [k' (and (string? k) (api-block/sanitize-user-property-name k))]
    (let [property-ident (api-block/get-db-ident-from-property-name k' plugin)]
      (<get-block property-ident))))

(defn get-favorites
  []
  (p/let [favorites (page-handler/<get-favorites)]
    (sdk-utils/result->js favorites)))

(defn insert-batch-blocks
  [this target blocks opts]
  (let [blocks' (walk/prewalk
                 (fn [f]
                   (if (and (map? f) (:content f) (nil? (:uuid f)))
                     (assoc f :uuid (random-uuid))
                     f))
                 blocks)
        {:keys [sibling before schema]} opts
        uuid->properties (let [blocks (outliner-core/tree-vec-flatten blocks' :children)]
                           (when (some (fn [b] (seq (:properties b))) blocks)
                             (zipmap (map :uuid blocks)
                                     (map :properties blocks))))]
    (p/let [block (if before
                    (db-async/<get-block-sibling (state/get-current-repo) (:db/id target) :left)
                    target)
            sibling? (if (entity/page? block) false sibling)
            result (editor-handler/insert-block-tree-after-target
                    (:db/id block) sibling? blocks' :markdown true)
            blocks (:blocks result)]
      (when (seq blocks)
        (p/doseq [block blocks]
          (let [id (:block/uuid block)
                properties (when uuid->properties (uuid->properties id))]
            (when (seq properties)
              (api-block/db-based-save-block-properties! block properties {:plugin this
                                                                          :schema schema})))))
      (p/let [blocks' (db-async/<get-blocks (state/get-current-repo)
                                            (map :block/uuid blocks))]
        (let [blocks' (keep :block blocks')]
          (sdk-utils/result->js blocks'))))))

(defn insert-block
  [this content properties schema opts]
  (p/let [new-block (editor-handler/api-insert-new-block! content opts)]
    (when (seq properties)
      (api-block/db-based-save-block-properties! new-block properties {:plugin this
                                                                       :schema schema}))
    (p/let [block (<get-block (:block/uuid new-block))]
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
                                   (dissoc opts :properties))
        ;; update editing block content if the block is currently being edited
       (when (= block-uuid (some-> (state/get-edit-block) :block/uuid))
         (state/set-edit-content! content))))))

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
  (let [valid-types #{:default :number :date :datetime :checkbox :url :node :asset :json :string}]
    (when-not (contains? valid-types type)
      (throw (ex-info (str "Invalid type, type should be one of: " valid-types) {:type type})))))

(defn- upsert-property-aux
  [this k schema opts]
  (p/let [k' (api-block/sanitize-user-property-name k)
          property-ident (api-block/get-db-ident-from-property-name k' this)
          _ (api-block/ensure-property-upsert-control this property-ident k')
          schema (or (some-> schema
                             (update-keys #(if (contains? #{:public} %)
                                             (keyword (str (name %) "?")) %)))
                     {})
          _ (when (:type schema)
              (schema-type-check! (keyword (:type schema))))
          schema (cond-> schema
                   (string? (:cardinality schema))
                   (-> (assoc :db/cardinality (->cardinality (:cardinality schema)))
                     (dissoc :cardinality))

                   (boolean? (:hide schema))
                   (-> (assoc :logseq.property/hide? (:hide schema))
                     (dissoc :hide))

                   (string? (:type schema))
                   (-> (assoc :logseq.property/type (keyword (:type schema)))
                     (dissoc :type)))
          p (db-property-handler/upsert-property! property-ident schema
                                                  (assoc opts :property-name k'))]
    (<get-block (:db/id p))))

(defn upsert-property
  "schema:
    {:type :default | :number | :date | :datetime | :checkbox | :url | :node | :asset | :json | :string
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
  (p/let [tags (db-async/<get-all-classes (state/get-current-repo)
                                          {:except-root-class? true})]
    (sdk-utils/result->js tags)))

(defn get-all-properties
  []
  (p/let [properties (db-async/<get-all-properties (state/get-current-repo) {})]
    (sdk-utils/result->js properties)))

(defn get-tag-objects
  [class-uuid-or-ident-or-title]
  (let [k (when-not (util/uuid-string? class-uuid-or-ident-or-title)
            (keyword (api-block/sanitize-user-property-name class-uuid-or-ident-or-title)))
        class-id (cond
                   (util/uuid-string? class-uuid-or-ident-or-title)
                   (sdk-utils/uuid-or-throw-error class-uuid-or-ident-or-title)

                   (qualified-keyword? k)
                   k

                   :else
                   class-uuid-or-ident-or-title)]
    (p/let [class (if (or (uuid? class-id) (qualified-keyword? class-id))
                    (<get-block class-id)
                    (db-async/<get-case-page (state/get-current-repo) class-id))]
      (when-not (entity/class? class)
        (throw (ex-info "Not a tag" {:input class-uuid-or-ident-or-title})))
      (if-not class
        (throw (ex-info (str "Tag not exists with id: " class-id) {}))
        (p/let [result (db-async/<get-class-objects-from-worker
                        (state/get-current-repo)
                        (:db/id class))]
          (sdk-utils/result->js result))))))

(defn create-tag [title ^js opts]
  (this-as this
           (when-not (string? title)
             (throw (ex-info "Tag title should be a string" {:title title})))
           (when (string/blank? title)
             (throw (ex-info "Tag title shouldn't be empty" {:title title})))
           (when (text/namespace-page? title)
             (throw (ex-info "Tag title shouldn't include forward slash" {:title title})))
           (p/let [opts (bean/->clj opts)
                   class-ident-namespace (api-block/resolve-class-prefix-for-db this)
                   opts' (assoc opts
                                :redirect? false
                                :class-ident-namespace class-ident-namespace)
                   tag-properties (:tagProperties opts)
                   tag (db-page-handler/<create-class! title opts')
                   properties (when (seq tag-properties)
                                (p/all (map
                                           (fn [{:keys [name schema properties]}]
                                             (let [name' (api-block/sanitize-user-property-name name)
                                                   property-ident (api-block/get-db-ident-from-property-name name' this)]
                                               (p/let [property-entity (<get-block property-ident)]
                                                 (or property-entity    ; property exists already
                                                     (upsert-property-aux this name schema {:properties properties})))))
                                        tag-properties)))]
             (when (seq properties)
               (db-property-handler/set-block-property! (:db/id tag)
                                                        :logseq.property.class/properties
                                                        (map :db/id properties)))
             (p/let [tag (<get-block (:db/id tag))]
               (sdk-utils/result->js tag)))))

(defn- throw-error-if-not-tag!
  [tag tag-id]
  (when-not (entity/class? tag)
    (throw (ex-info (str "Not a tag: " tag-id)
                    {:tag tag}))))

(defn add-tag-extends [tag-id extend-id]
  (p/let [tag (db-async/<get-block (state/get-current-repo) tag-id)
          extend (db-async/<get-block (state/get-current-repo) extend-id)]
    (throw-error-if-not-tag! tag tag-id)
    (throw-error-if-not-tag! extend extend-id)
    (when (ldb/built-in? tag)
      (throw (ex-info "Built-in tag's extends can't be modified" {:tag tag})))
    (db-property-handler/set-block-property! (:db/id tag)
                                             :logseq.property.class/extends
                                             (:db/id extend))))

(defn remove-tag-extends [tag-id extend-id]
  (p/let [tag (db-async/<get-block (state/get-current-repo) tag-id)
          extend (db-async/<get-block (state/get-current-repo) extend-id)]
    (throw-error-if-not-tag! tag tag-id)
    (throw-error-if-not-tag! extend extend-id)
    (when (ldb/built-in? tag)
      (throw (ex-info "Built-in tag's extends can't be modified" {:tag tag})))
    (db-property-handler/delete-property-value! (:db/id tag)
                                                :logseq.property.class/extends
                                                (:db/id extend))))

(defn- resolve-eid [^js plugin uuid-or-ident-or-title prefix-resolver]
  (let [eid (if (number? uuid-or-ident-or-title)
              uuid-or-ident-or-title
              (let [title-or-ident (-> (if-not (string? uuid-or-ident-or-title)
                                         (str uuid-or-ident-or-title)
                                         uuid-or-ident-or-title)
                                       (string/replace #"^:+" ""))]
                (if (text/namespace-page? title-or-ident)
                  (keyword title-or-ident)
                  (if (util/uuid-string? title-or-ident)
                    (when-let [id (sdk-utils/uuid-or-throw-error title-or-ident)]
                      [:block/uuid id])
                    (keyword (prefix-resolver plugin) title-or-ident)))))]
    eid))

(defn resolve-tag-eid [this class-uuid-or-ident-or-title]
  (resolve-eid this class-uuid-or-ident-or-title
               api-block/resolve-class-prefix-for-db))

(defn resolve-property-eid [this prop-uuid-or-ident-or-title]
  (resolve-eid this prop-uuid-or-ident-or-title
               api-block/resolve-property-prefix-for-db))

(defn- get-tags [name]
  (db-async/<get-tags-by-name (state/get-current-repo) name))

(defn get-tag [class-uuid-or-ident-or-title]
  (this-as this
           (p/let [eid (resolve-tag-eid this class-uuid-or-ident-or-title)
                   tag (<get-block eid)
                   tags-by-name (when-not tag (get-tags class-uuid-or-ident-or-title))
                   tag (or tag (first tags-by-name))]
             (when (entity/class? tag)
               (sdk-utils/result->js tag)))))

(defn get-tags-by-name [name]
  (p/let [tags (get-tags name)]
    (sdk-utils/result->js tags)))

(defn tag-add-property [tag-id property-id-or-name]
  (this-as this
           (p/let [tag (db-async/<get-case-page (state/get-current-repo) tag-id)
                   eid (resolve-property-eid this property-id-or-name)
                   property (<get-block eid)]
             (when-not (entity/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
             (when-not (entity/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
             (when (and (not (ldb/public-built-in-property? property))
                        (ldb/built-in? property))
               (throw (ex-info "This is a private built-in property that can't be used." {:value property})))
             (p/do!
              (db-property-handler/class-add-property! (:db/id tag) (:db/ident property))
              (p/let [tag (db-async/<get-case-page (state/get-current-repo) tag-id)]
                (sdk-utils/result->js tag))))))

(defn tag-remove-property [tag-id property-id-or-name]
  (p/let [repo (state/get-current-repo)
          tag (db-async/<get-case-page repo tag-id)
          property (db-async/<get-case-page repo property-id-or-name)]
    (when-not (entity/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
    (when-not (entity/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
    (p/do!
     (db-property-handler/class-remove-property! (:db/id tag) (:db/ident property))
     (p/let [tag (db-async/<get-case-page repo tag-id)]
       (sdk-utils/result->js tag)))))

(defn add-block-tag [id-or-name tag-id]
  (this-as this
           (p/let [repo (state/get-current-repo)
                   block (db-async/<get-block repo id-or-name)
                   tag-eid (resolve-tag-eid this tag-id)
                   tag-by-eid (db-async/<get-block repo tag-eid)
                   tag (or tag-by-eid (db-async/<get-block repo tag-id))]
             (when-not (entity/class? tag)
               (throw (ex-info (str "Not a tag: " tag-id)
                               {:tag (pr-str tag)})))
             (when (and tag block)
               (db-page-handler/add-tag repo (:db/id block) tag)))))

(defn remove-block-tag [id-or-name tag-id]
  (this-as this
           (p/let [repo (state/get-current-repo)
                   block (db-async/<get-block repo id-or-name)
                   tag-eid (resolve-tag-eid this tag-id)
                   tag-by-eid (db-async/<get-block repo tag-eid)
                   tag (or tag-by-eid (db-async/<get-block repo tag-id))]
             (when-not (entity/class? tag)
               (throw (ex-info (str "Not a tag: " tag-id)
                               {:tag tag})))
             (when (and block tag)
               (db-property-handler/delete-property-value!
                (:db/id block) :block/tags (:db/id tag))))))

(defn set-block-icon
  [block-id icon-type icon-name]
  (when-not (contains? #{"tabler-icon" "emoji"} icon-type)
    (throw (ex-info "icon-type should be one of [tabler-icon, emoji]" {:icon-type icon-type})))
  (when (or (not (string? icon-name))
            (string/blank? icon-name))
    (throw (ex-info "icon-name should be a non-blank string" {:icon-name icon-name})))
  (when (= icon-type "emoji")
    (when-not (name->emoji icon-name)
      (throw (ex-info (str "Can't find emoji for " icon-name) {}))))
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo block-id)]
    (db-property-handler/set-block-property! (:db/id block)
                                             :logseq.property/icon
                                             {:type (keyword icon-type)
                                              :id (if (= icon-type "emoji")
                                                    (:id (first (name->emoji icon-name)))
                                                    icon-name)})))

(defn remove-block-icon
  [block-id]
  (p/let [repo (state/get-current-repo)
          block (db-async/<get-block repo block-id)]
    (db-property-handler/remove-block-property! (:block/uuid block)
                                                :logseq.property/icon)))

(defn add-property-value-choices [property-id ^js choices]
  (when-let [values (and property-id (bean/->clj choices))]
    (db-property-handler/add-existing-values-to-closed-values!
     property-id values)))

(defn set-property-node-tags [property-id ^js tag-ids]
  (let [tag-ids (and property-id (seq (bean/->clj tag-ids)))]
    (p/let [repo (state/get-current-repo)
            property (db-async/<get-block repo property-id)]
      (when-not (entity/property? property)
        (throw (ex-info "Not a valid property" {:property property-id})))

      (doseq [tag-id tag-ids]
        (when-not (number? tag-id)
          (throw (ex-info "Tag id should be a number" {:tag-id tag-id}))))

      (db-property-handler/set-block-property!
       (:db/id property) :logseq.property/classes tag-ids))))
