(ns logseq.api.db-based
  "DB version related fns"
  (:require ["@emoji-mart/data" :as emoji-data]
            [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as db-conn]
            [frontend.db.model :as db-model]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.handler.page :as page-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.graph-parser.text :as text]
            [logseq.outliner.core :as outliner-core]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defonce ^:private name->emoji
  (->> (vals (bean/->clj (gobj/get emoji-data "emojis")))
       (group-by :name)))

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
        sibling? (if (entity-util/page? block) false sibling)
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
  (let [k' (api-block/sanitize-user-property-name k)
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
    (db/entity (:db/id p))))

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
  (let [opts {:schema (when schema
                        {key' schema})
              :reset-property-values reset-property-values}]
    (save-block-properties! this block {key' value} opts)))

(defn- save-block-properties!
  [this block properties {:keys [schema reset-property-values]}]
  (when (seq properties)
    (api-block/db-based-save-block-properties! block properties {:plugin this
                                                                 :schema schema
                                                                 :reset-property-values reset-property-values})))

(defn- normalize-js-data
  [input]
  (some->> (js->clj input :keywordize-keys true)
           (walk/postwalk
            (fn [node]
              (if (map? node)
                (into {}
                      (map (fn [[k v]]
                             [(if (keyword? k)
                                (csk/->kebab-case-keyword k)
                                k)
                              v]))
                      node)
                node)))))

(defn- resolve-block!
  [block-or-id]
  (let [block (cond
                (de/entity? block-or-id)
                block-or-id

                (map? block-or-id)
                (or (when-let [db-id (:db/id block-or-id)]
                      (db/entity db-id))
                    (when-let [block-uuid (:block/uuid block-or-id)]
                      (db/entity [:block/uuid block-uuid])))

                (number? block-or-id)
                (db/entity block-or-id)

                (uuid? block-or-id)
                (db/entity [:block/uuid block-or-id])

                (util/uuid-string? block-or-id)
                (db/entity [:block/uuid (uuid block-or-id)])

                :else nil)]
    (when-not block
      (throw (ex-info "Block not found" {:input block-or-id})))
    block))

(defn- resolve-page-uuid!
  [page]
  (cond
    (de/entity? page)
    (:block/uuid page)

    (map? page)
    (or (let [page-uuid (:block/uuid page)]
          (cond
            (uuid? page-uuid)
            page-uuid

            (util/uuid-string? page-uuid)
            (uuid page-uuid)

            :else nil))
        (some-> (:db/id page) db/entity :block/uuid)
        (throw (ex-info "Page not found" {:input page})))

    (uuid? page)
    page

    (util/uuid-string? page)
    (uuid page)

    (string? page)
    (or (some-> (db/get-page page) :block/uuid)
        (throw (ex-info "Page not found" {:input page})))

    :else
    (throw (ex-info "Page not found" {:input page}))))

(defn- resolve-transaction-outliner-op
  [actions]
  (if (= 1 (count actions))
    (case (:type (first actions))
      "createPage" :create-page
      "renamePage" :rename-page
      "deletePage" :delete-page
      "upsertProperty" :upsert-property
      "removeProperty" :delete-page
      "rawTx" :transact
      :save-block)
    :plugin-transact))

(defn- blank-input?
  [value]
  (or (nil? value)
      (and (string? value) (string/blank? value))))

(defn- normalize-create-page-options
  [options]
  (let [options' (or options {})]
    (cond-> options'
      (contains? options' :persist-op)
      (-> (assoc :persist-op? (:persist-op options'))
        (dissoc :persist-op))

      (contains? options' :class)
      (-> (assoc :class? (:class options'))
        (dissoc :class))

      (contains? options' :journal)
      (-> (assoc :journal? (:journal options'))
        (dissoc :journal))

      (contains? options' :today-journal)
      (-> (assoc :today-journal? (:today-journal options'))
        (dissoc :today-journal))

      (contains? options' :split-namespace)
      (-> (assoc :split-namespace? (:split-namespace options'))
        (dissoc :split-namespace))

      (util/uuid-string? (:uuid options'))
      (update :uuid uuid)

      (sequential? (:tags options'))
      (update :tags (fn [tags]
                      (mapv (fn [tag]
                              (if (util/uuid-string? tag)
                                (uuid tag)
                                tag))
                            tags))))))

(defn- remove-property!*
  [this k]
  (when-let [property (-get-property this k)]
    (when-let [property-uuid (and (api-block/plugin-property-key? (:db/ident property))
                                  (:block/uuid property))]
      (outliner-op/delete-page! property-uuid {}))))

(defn- run-transaction-action!
  [this action]
  (case (:type action)
    "updateBlock"
    (let [{:keys [block content properties schema reset-property-values]} action
          block-entity (resolve-block! block)]
      (when (and (nil? content) (empty? properties))
        (throw (ex-info "updateBlock requires content and/or properties" {:action action})))
      (save-block-properties! this block-entity properties {:schema schema
                                                            :reset-property-values reset-property-values})
      (when (some? content)
        (when-not (string? content)
          (throw (ex-info "updateBlock content must be a string" {:action action})))
        (editor-handler/save-block! (state/get-current-repo) (:block/uuid block-entity) content {})))

    "createPage"
    (let [{:keys [page-name options]} action]
      (when (blank-input? page-name)
        (throw (ex-info "createPage pageName must not be blank" {:action action})))
      (outliner-op/create-page! page-name (normalize-create-page-options options)))

    "renamePage"
    (let [{:keys [page new-name]} action]
      (when (blank-input? new-name)
        (throw (ex-info "renamePage newName must not be blank" {:action action})))
      (outliner-op/rename-page! (resolve-page-uuid! page) new-name))

    "deletePage"
    (let [{:keys [page options]} action]
      (outliner-op/delete-page! (resolve-page-uuid! page) (or options {})))

    "upsertProperty"
    (let [{:keys [key schema options]} action]
      (when (blank-input? key)
        (throw (ex-info "upsertProperty key must not be blank" {:action action})))
      (upsert-property-aux this key schema (or options {})))

    "removeProperty"
    (let [{:keys [key]} action]
      (when (blank-input? key)
        (throw (ex-info "removeProperty key must not be blank" {:action action})))
      (remove-property!* this key))

    "upsertBlockProperty"
    (let [{:keys [block key value options]} action
          block-entity (resolve-block! block)]
      (when (blank-input? key)
        (throw (ex-info "upsertBlockProperty key must not be blank" {:action action})))
      (upsert-block-property this
                             block-entity
                             key
                             value
                             {:schema (:schema options)
                              :reset-property-values (:reset options)}))

    "removeBlockProperty"
    (let [{:keys [block key]} action]
      (when (blank-input? key)
        (throw (ex-info "removeBlockProperty key must not be blank" {:action action})))
      (let [block-entity (resolve-block! block)
            property-ident (api-block/get-db-ident-from-property-name key this)]
        (outliner-op/remove-block-property! (:db/id block-entity) property-ident)))

    "rawTx"
    (let [{:keys [tx-data tx-meta]} action]
      (when-not (seq tx-data)
        (throw (ex-info "rawTx txData must not be empty" {:action action})))
      (outliner-op/transact! tx-data tx-meta))

    (throw (ex-info "Unsupported DB transaction action"
                    {:action-type (:type action)
                     :action action}))))

(defn transact
  [^js actions ^js opts]
  (this-as
   this
   (let [actions' (vec (or (normalize-js-data actions) []))]
     (when-not (seq actions')
       (throw (ex-info "DB.transact requires at least one action" {})))
     (let [opts' (or (normalize-js-data opts) {})
           tx-id (random-uuid)
           persist-op? (if (contains? opts' :persist-op)
                         (boolean (:persist-op opts'))
                         true)
           undo-group (:undo-group opts')
           outliner-op (resolve-transaction-outliner-op actions')]
       (ui-outliner-tx/transact!
        {:db-sync/tx-id tx-id
         :outliner-op outliner-op
         :persist-op? persist-op?
         :undo-group undo-group}
        (doseq [action actions']
          (run-transaction-action! this action)))
       (sdk-utils/result->js
        (cond-> {:tx-id tx-id
                 :outliner-op outliner-op
                 :action-count (count actions')
                 :persist-op persist-op?}
          (some? undo-group)
          (assoc :undo-group undo-group)))))))

(defn get-all-tags
  []
  (-> (db-model/get-all-classes (state/get-current-repo)
                                {:except-root-class? true})
      sdk-utils/result->js))

(defn get-all-properties
  []
  (-> (db-model/get-all-properties (state/get-current-repo))
      sdk-utils/result->js))

(defn get-tag-objects
  [class-uuid-or-ident-or-title]
  (let [eid (if (util/uuid-string? class-uuid-or-ident-or-title)
              (when-let [id (sdk-utils/uuid-or-throw-error class-uuid-or-ident-or-title)]
                [:block/uuid id])
              (let [k (keyword (api-block/sanitize-user-property-name class-uuid-or-ident-or-title))]
                (if (qualified-keyword? k)
                  k
                  (some-> (ldb/get-case-page (db/get-db) class-uuid-or-ident-or-title) :db/id))))
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
                                                property-ident (api-block/get-db-ident-from-property-name name' this)
                                                property-entity (db/entity property-ident)]
                                            (or property-entity    ; property exists already
                                                (upsert-property-aux this name schema {:properties properties}))))
                                        tag-properties)))]
             (when (seq properties)
               (db-property-handler/set-block-property! (:db/id tag)
                                                        :logseq.property.class/properties
                                                        (map :db/id properties)))
             (let [tag (db/entity (:db/id tag))]
               (sdk-utils/result->js tag)))))

(defn- throw-error-if-not-tag!
  [tag tag-id]
  (when-not (ldb/class? tag)
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
  (some->> (entity-util/get-pages-by-name (db-conn/get-db) name)
           (map #(some-> % (first) (db/entity)))
           (filter ldb/class?)))

(defn get-tag [class-uuid-or-ident-or-title]
  (this-as this
           (let [eid (resolve-tag-eid this class-uuid-or-ident-or-title)
                 tag (db/entity eid)
                 tag (or tag (some-> (get-tags class-uuid-or-ident-or-title) first))]
             (when (ldb/class? tag)
               (sdk-utils/result->js tag)))))

(defn get-tags-by-name [name]
  (when-let [tags (get-tags name)]
    (sdk-utils/result->js tags)))

(defn tag-add-property [tag-id property-id-or-name]
  (this-as this
           (p/let [tag (db/get-case-page tag-id)
                   eid (resolve-property-eid this property-id-or-name)
                   property (db/entity eid)]
             (when-not (ldb/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
             (when-not (ldb/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
             (when (and (not (ldb/public-built-in-property? property))
                        (ldb/built-in? property))
               (throw (ex-info "This is a private built-in property that can't be used." {:value property})))
             (p/do!
              (db-property-handler/class-add-property! (:db/id tag) (:db/ident property))
              (sdk-utils/result->js (db/get-case-page tag-id))))))

(defn tag-remove-property [tag-id property-id-or-name]
  (p/let [tag (db/get-case-page tag-id)
          property (db/get-case-page property-id-or-name)]
    (when-not (ldb/class? tag) (throw (ex-info "Not a valid tag" {:tag tag-id})))
    (when-not (ldb/property? property) (throw (ex-info "Not a valid property" {:property property-id-or-name})))
    (p/do!
     (db-property-handler/class-remove-property! (:db/id tag) (:db/ident property))
     (sdk-utils/result->js (db/get-case-page tag-id)))))

(defn add-block-tag [id-or-name tag-id]
  (this-as this
           (p/let [repo (state/get-current-repo)
                   block (db-async/<get-block repo id-or-name)
                   tag-eid (resolve-tag-eid this tag-id)
                   tag (or (db/entity tag-eid)
                           (db-async/<get-block repo tag-id))]
             (when-not (ldb/class? tag)
               (throw (ex-info (str "Not a tag: " tag-id)
                               {:tag (pr-str tag)})))
             (when (and tag block)
               (db-page-handler/add-tag repo (:db/id block) tag)))))

(defn remove-block-tag [id-or-name tag-id]
  (this-as this
           (p/let [repo (state/get-current-repo)
                   block (db-async/<get-block repo id-or-name)
                   tag-eid (resolve-tag-eid this tag-id)
                   tag (or (db/entity tag-eid)
                           (db-async/<get-block repo tag-id))]
             (when-not (ldb/class? tag)
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
      (when-not (ldb/property? property)
        (throw (ex-info "Not a valid property" {:property property-id})))

      (doseq [tag-id tag-ids]
        (when-not (number? tag-id)
          (throw (ex-info "Tag id should be a number" {:tag-id tag-id}))))

      (db-property-handler/set-block-property!
       (:db/id property) :logseq.property/classes tag-ids))))
