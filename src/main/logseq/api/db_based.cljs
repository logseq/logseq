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
            [logseq.common.util :as common-util]
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
  (when (and (string? k) (not (string/blank? (string/trim k))))
    (let [property-ident (api-block/get-db-ident-from-property-name k plugin)]
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
        flat-blocks (outliner-core/tree-vec-flatten blocks' :children)
        block-uuids (mapv :uuid flat-blocks)
        uuid->properties (let [blocks flat-blocks]
                           (when (some (fn [b] (seq (:properties b))) blocks)
                             (zipmap (map :uuid blocks)
                                     (map :properties blocks))))]
    (p/let [block (if before
                    (db-async/<get-block-sibling (state/get-current-repo) (:db/id target) :left)
                    target)
            sibling? (if (entity/page? block) false sibling)
            page-id (if (or (entity/page? block) (:block/name block))
                      (:db/id block)
                      (let [page (:block/page block)]
                        (if (map? page) (:db/id page) page)))
            _ (editor-handler/insert-block-tree-after-target
               (:db/id block) sibling? blocks' :markdown true)
            _ (when (seq uuid->properties)
                (p/doseq [id block-uuids]
                  (when-let [properties (seq (uuid->properties id))]
                    (api-block/db-based-save-block-properties! {:block/uuid id} properties
                                                               {:plugin this
                                                                :page-id page-id
                                                                :schema schema}))))
            blocks' (db-async/<get-blocks (state/get-current-repo) block-uuids)]
      (sdk-utils/result->js (keep :block blocks')))))

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

(defn get-properties-by-title [title]
  (let [repo (state/get-current-repo)]
    (p/let [properties (db-async/<q repo
                                   {:transact-db? false}
                                   '[:find [(pull ?property [:db/ident :block/title :logseq.property/type]) ...]
                                     :in $ ?title
                                     :where
                                     [?property :block/title ?title]
                                     [?property :block/tags ?class]
                                     [?class :db/ident :logseq.class/Property]]
                                   title)]
      (sdk-utils/result->js properties))))

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
          property-ident (api-block/get-db-ident-from-property-name k this)
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
     (when property
       (if (api-block/plugin-property-key? (:db/ident property))
         (page-common-handler/<delete! (:block/uuid property) nil nil)
         (throw (ex-info "Plugins can only remove their own properties"
                         {:property k
                          :property-ident (:db/ident property)})))))))

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
                   opts' (cond-> (assoc opts
                                        :redirect? false
                                        :class-ident-namespace class-ident-namespace)
                           (and (string? (:uuid opts))
                                (common-util/uuid-string? (:uuid opts)))
                           (update :uuid uuid))
                   tag-properties (:tagProperties opts)
                   tag (db-page-handler/<create-class! title opts')
                   properties (when (seq tag-properties)
                                 (p/all (map
                                           (fn [{:keys [name schema properties]}]
                                             (let [property-ident (api-block/get-db-ident-from-property-name name this)]
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
                    (sdk-utils/uuid-or-throw-error title-or-ident)
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

(defn get-tag-users [tag-uuid]
  (let [repo (state/get-current-repo)
        tag-uuid (sdk-utils/uuid-or-throw-error tag-uuid)]
    (p/let [users (db-async/<q repo {}
                               '[:find [(pull ?holder [:block/uuid :block/title :block/name
                                                      :block/page]) ...]
                                 :in $ ?tag-uuid
                                 :where [?tag :block/uuid ?tag-uuid]
                                        [?holder :block/tags ?tag]]
                               tag-uuid)]
      (sdk-utils/result->js users))))

    (declare <inspect-page-query inspect-page-structural-property?)

(defn get-backlinks [target-uuid]
  (when-not (util/uuid-string? target-uuid)
    (throw (js/Error. "target_uuid must be a UUID")))
  (let [repo (state/get-current-repo)
        target-uuid* (sdk-utils/uuid-or-throw-error target-uuid)]
    (p/let [target-id (<inspect-page-query
                       repo
                       "[:find ?target . :in $ ?uuid :where [?target :block/uuid ?uuid]]"
                       target-uuid*)
            refs (if target-id
                   (<inspect-page-query
                    repo
                    "[:find [(pull ?entity [:block/uuid :block/title :block/name :block/page]) ...] :in $ ?target :where [?entity :block/refs ?target]]"
                    target-id)
                   [])
            tagged (if target-id
                     (<inspect-page-query
                      repo
                      "[:find [(pull ?entity [:block/uuid :block/title :block/name :block/page]) ...] :in $ ?target :where [?entity :block/tags ?target]]"
                      target-id)
                     [])
            property-class (<inspect-page-query
                            repo
                            "[:find ?class . :where [?class :db/ident :logseq.class/Property]]")
            value-rows (if target-id
                         (<inspect-page-query
                          repo
                          "[:find (pull ?entity [:block/uuid :block/title :block/name :block/page]) (pull ?property [:db/ident :block/title]) :in $ ?target ?class :where [?property :block/tags ?class] [?property :db/ident ?attribute] [?entity ?attribute ?target]]"
                          target-id property-class)
                         [])]
      (let [property-values (->> value-rows
                                (remove #(inspect-page-structural-property? (second %)))
                                (mapv (fn [[holder property]]
                                        {:holder holder :property property})))
            total (+ (count refs) (count tagged) (count property-values))]
        (bean/->js
         (sdk-utils/normalize-keyword-for-json
          {:target_uuid target-uuid
           :total total
           :refs refs
           :tagged tagged
           :property_values property-values
           :diagnostic (if (pos? total)
                         (str (count refs) " reference(s), "
                              (count tagged) " tag holder(s), "
                              (count property-values) " property value(s).")
                         "Nothing refers to this entity.")}
          false))))))

(defn get-title-holders [title]
  (let [repo (state/get-current-repo)
        query "[:find [(pull ?entity [:block/uuid :block/title :block/name :db/ident :block/tags :logseq.property/deleted-at {:block/tags [:db/ident]}]) ...] :in $ ?title :where [?entity :block/title ?title]]"]
    (p/let [entities (db-async/<q repo {:transact-db? false}
                                  (cljs.reader/read-string query)
                                  title)]
      (bean/->js (sdk-utils/normalize-keyword-for-json entities false)))))

(defn get-title-inventory []
  (let [repo (state/get-current-repo)]
    (p/let [page-class (db-async/<q repo {} '[:find ?class . :where [?class :db/ident :logseq.class/Page]])
            tag-class (db-async/<q repo {} '[:find ?class . :where [?class :db/ident :logseq.class/Tag]])
            entities (db-async/<q
                      repo
                      {:transact-db? false}
                      '[:find [(pull ?entity [:db/id :block/uuid :block/title :block/name
                                              :logseq.property/deleted-at {:block/tags [:db/id]}]) ...]
                        :in $ [?class ...]
                        :where [?entity :block/tags ?class]]
                      [page-class tag-class])]
      (bean/->js
       (mapv (fn [entity]
               (let [tag-ids (set (map :db/id (:block/tags entity)))]
                 {:id (:db/id entity)
                  :uuid (:block/uuid entity)
                  :title (:block/title entity)
                  :kind (if (contains? tag-ids tag-class) "tag" "page")
                  :recycled (some? (:logseq.property/deleted-at entity))}))
             entities)))))

(defn get-journal-candidates []
  (let [repo (state/get-current-repo)]
    (p/let [journals (db-async/<q
                     repo
                     {:transact-db? false}
                     '[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/journal-day]) ...]
                       :where [?page :block/journal-day _]])]
      (bean/->js (sdk-utils/normalize-keyword-for-json journals false)))))

(defn list-recycled []
  (let [repo (state/get-current-repo)]
    (p/let [entities (db-async/<q
                      repo
                      {:transact-db? false}
                      '[:find [(pull ?entity [:block/uuid :block/name :block/title
                                              :logseq.property/deleted-at]) ...]
                        :where [?entity :logseq.property/deleted-at _]])]
      (bean/->js (sdk-utils/normalize-keyword-for-json entities false)))))

(defn get-status-rows []
  (let [repo (state/get-current-repo)]
    (p/let [rows (db-async/<q
                  repo
                  {:transact-db? false}
                  '[:find (pull ?entity [:block/uuid :block/title :block/name :block/page])
                         (pull ?value [:db/ident :block/title])
                    :where [?entity :logseq.property/status ?value]])]
      (bean/->js (sdk-utils/normalize-keyword-for-json rows false)))))

(defn get-closed-values []
  (let [repo (state/get-current-repo)]
    (p/let [rows (db-async/<q
                  repo
                  {:transact-db? false}
                  '[:find (pull ?property [:db/ident :block/title])
                         (pull ?value [:db/ident :block/title :block/order])
                    :where [?value :block/closed-value-property ?property]])]
      (bean/->js (sdk-utils/normalize-keyword-for-json rows false)))))

(def ^:private inspect-page-details
  #{"page" "blocks" "tags" "properties" "declared" "all"})

(def ^:private inspect-page-structural-properties
  #{"parent" "page" "order" "title" "name" "uuid" "ident"
    "content" "full-title" "raw-title" "refs" "path-refs"
    "tx-id" "created-at" "updated-at" "format" "collapsed?"
    "journal-day" "journal?" "left"})

(defn- inspect-page-field [entity field]
  (or (get entity field)
      (case field
        :id (:db/id entity)
        :uuid (:block/uuid entity)
        :name (:block/name entity)
        :title (:block/title entity)
        :page (:block/page entity)
        :_parent (:block/_parent entity)
        nil)))

(defn- inspect-page-query-rows [result]
  (if (and (= 1 (count result)) (vector? (first result)))
    (first result)
    result))

(defn- inspect-page-structural-property? [property]
  (let [ident (or (:ident property) (:db/ident property))
        bare (some-> ident (string/replace-first #"^:" ""))]
    (or (and bare (or (string/starts-with? bare "block/")
                      (string/starts-with? bare "db/")))
        (and bare
             (not (string/includes? bare "/"))
             (contains? inspect-page-structural-properties bare)))))

(defn- <inspect-page-query [repo query & inputs]
  (p/let [result (apply db-async/<q
                        repo
                        {:transact-db? false}
                        (cljs.reader/read-string query)
                        inputs)]
    (-> result
        (sdk-utils/normalize-keyword-for-json false)
        bean/->js
        (js->clj :keywordize-keys true))))

(defn- <inspect-page-block-uuids [repo page-uuid]
  (let [tree-query "[:find (pull ?root [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]} {:block/_parent ...}]) . :in $ ?uuid :where [?root :block/uuid ?uuid]]"]
    (p/let [root (<inspect-page-query repo tree-query page-uuid)]
      (when-not root
        (throw (js/Error. (str "No entity exists with exact UUID " page-uuid))))
      (when-not (or (:name root) (:block/name root))
        (throw (js/Error. "UUID identifies a block, not a page")))
      (letfn [(descendants [node]
                (mapcat (fn [child]
                          (cons (dissoc child :_parent :block/_parent)
                                (descendants child)))
                        (or (:_parent node) (:block/_parent node) [])))]
        (mapv #(assoc % :page_uuid (str page-uuid))
              (sort-by #(str (or (:order %) (:block/order %)))
                       (descendants root)))))))

(defn inspect-page [page-uuid detail]
  (let [detail (or detail "page")]
    (when-not (util/uuid-string? page-uuid)
      (throw (js/Error. "page_uuid must be a UUID")))
    (when-not (contains? inspect-page-details detail)
      (throw (js/Error. "detail must be one of: page, blocks, tags, properties, declared, all")))
    (let [repo (state/get-current-repo)
          page-uuid (sdk-utils/uuid-or-throw-error page-uuid)
          page-query "[:find (pull ?entity [*]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"]
      (p/let [page (<inspect-page-query repo page-query page-uuid)]
        (cond
          (nil? page)
          #js {:found false :page_uuid (str page-uuid) :page nil}

          (not (inspect-page-field page :name))
          #js {:found false :page_uuid (str page-uuid) :page nil
               :reason "target is a block, not a page"}

          :else
          (let [page-id (inspect-page-field page :id)
                with-blocks? (contains? #{"blocks" "all"} detail)
                with-tags? (contains? #{"tags" "all"} detail)
                with-properties? (contains? #{"properties" "all"} detail)
                with-declared? (contains? #{"declared" "all"} detail)]
            (p/let [blocks (when with-blocks?
                             (<inspect-page-block-uuids repo page-uuid))
                    tags-result (when with-tags?
                                  (<inspect-page-query
                                   repo
                                   "[:find [(pull ?holder [:db/id :block/uuid :block/title :block/name {:block/tags [:db/id :db/ident :block/title]}]) ...] :in $ ?page :where (or-join [?page ?holder] [(identity ?page) ?holder] [?holder :block/page ?page]) [?holder :block/tags _]]"
                                   page-id))
                    property-class (when with-properties?
                                     (<inspect-page-query
                                      repo
                                      "[:find ?class . :where [?class :db/ident :logseq.class/Property]]"))
                    property-rows-result (when with-properties?
                                           (<inspect-page-query
                                            repo
                                            "[:find (pull ?prop [:db/id :db/ident :block/title]) (pull ?holder [:db/id :block/uuid :block/title :block/name]) ?value :in $ ?page ?class :where (or-join [?page ?holder] [(identity ?page) ?holder] [?holder :block/page ?page]) [?prop :block/tags ?class] [?prop :db/ident ?attr] [?holder ?attr ?value]]"
                                            page-id property-class))
                    declared-result (when with-declared?
                                      (<inspect-page-query
                                       repo
                                       "[:find (pull ?class [:db/ident :block/title]) (pull ?prop [:db/id :db/ident :block/uuid :block/title :logseq.property/type]) :in $ ?page :where [?page :block/tags ?class] [?class :logseq.property.class/properties ?prop]]"
                                       page-id))
                    tags (when with-tags?
                           (inspect-page-query-rows tags-result))
                    properties (if with-properties?
                                 (let [rows (filterv #(and (vector? %) (= 3 (count %))
                                                           (not (inspect-page-structural-property? (first %))))
                                                     (js->clj property-rows-result :keywordize-keys true))
                                       entity-ids (->> rows
                                                       (keep #(nth % 2))
                                                       (filter #(and (number? %) (not (boolean? %))))
                                                       set)
                                       resolved-query "[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/value]) ...] :in $ [?e ...] :where [?e ?a _]]"]
                                   (p/let [resolved-result (if (seq entity-ids)
                                                             (<inspect-page-query repo resolved-query (vec entity-ids))
                                                             [])
                                           resolved (into {}
                                                          (keep (fn [entity]
                                                                  (let [id (inspect-page-field entity :id)]
                                                                    (when (some? id) [id entity]))))
                                                          (inspect-page-query-rows resolved-result))]
                                     (mapv (fn [[property holder value]]
                                             {:property property
                                              :holder holder
                                              :value value
                                              :value_entity (when (and (number? value)
                                                                       (not (boolean? value)))
                                                              (get resolved value))})
                                           rows)))
                                 nil)
                    declared (when with-declared?
                               (mapv (fn [[class property]]
                                       {:class class :property property})
                                     (js->clj declared-result :keywordize-keys true)))]
              (bean/->js
               (cond-> {:found true :page_uuid (str page-uuid) :page page}
                 with-blocks? (assoc :blocks blocks)
                 with-tags? (assoc :tags tags)
                 with-properties? (assoc :properties properties)
                 with-declared? (assoc :declared_properties declared))))))))))

(defn- page-stats-subtree [tree root-id]
  (let [own (atom 0)
        nested (atom 0)
        orphans (atom 0)]
    (letfn [(walk [node expected-page]
              (doseq [child (or (inspect-page-field node :_parent) [])]
                (let [child-id (inspect-page-field child :id)
                      page (inspect-page-field child :page)
                      page-id (if (map? page) (inspect-page-field page :id) page)]
                  (if (inspect-page-field child :name)
                    (do
                      (swap! nested inc)
                      (walk child child-id))
                    (do
                      (if (= page-id expected-page)
                        (swap! own inc)
                        (swap! orphans inc))
                      (walk child expected-page))))))]
      (walk tree root-id)
      {:own @own :nested @nested :orphans @orphans})))

(defn get-page-stats [page-uuid]
  (when-not (util/uuid-string? page-uuid)
    (throw (js/Error. "page_uuid must be a UUID")))
  (let [repo (state/get-current-repo)
        page-uuid* (sdk-utils/uuid-or-throw-error page-uuid)]
    (p/let [page (<inspect-page-query
                  repo
                  "[:find (pull ?entity [*]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"
                  page-uuid*)]
      (when-not page
        (throw (js/Error. (str "No entity exists with exact UUID " page-uuid))))
      (when-not (inspect-page-field page :name)
        (throw (js/Error. "UUID identifies a block, not a page")))
      (let [page-id (inspect-page-field page :id)
            property-values-query "[:find (pull ?prop [:db/ident]) ?e :in $ ?target ?class :where [?prop :block/tags ?class] [?prop :db/ident ?attr] [?e ?attr ?target]]"]
        (p/let [tree (<inspect-page-query
                      repo
                      "[:find (pull ?root [:db/id :block/uuid :block/title :block/name {:block/page [:db/id]} {:block/_parent ...}]) . :in $ ?uuid :where [?root :block/uuid ?uuid]]"
                      page-uuid*)
                aliases-by (<inspect-page-query
                            repo
                            "[:find [(pull ?holder [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?target :where (or-join [?holder ?target] [?holder :logseq.property/alias ?target] [?holder :block/alias ?target])]"
                            page-id)
                aliases (<inspect-page-query
                         repo
                         "[:find [(pull ?alias [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?page :where (or-join [?page ?alias] [?page :logseq.property/alias ?alias] [?page :block/alias ?alias])]"
                         page-id)
                by-page (<inspect-page-query
                         repo
                         "[:find (count ?b) . :in $ ?page :where [?b :block/page ?page]]"
                         page-id)
                empty-count (<inspect-page-query
                             repo
                             "[:find (count ?b) . :in $ ?page :where [?b :block/page ?page] [?b :block/title \"\"]]"
                             page-id)
                refs (<inspect-page-query
                      repo
                      "[:find (count ?e) . :in $ ?target :where [?e :block/refs ?target]]"
                      page-id)
                tag-holders (<inspect-page-query
                             repo
                             "[:find (count ?e) . :in $ ?target :where [?e :block/tags ?target]]"
                             page-id)
                property-class (<inspect-page-query
                                repo
                                "[:find ?class . :where [?class :db/ident :logseq.class/Property]]")
                property-rows (<inspect-page-query
                               repo property-values-query page-id property-class)]
          (let [{:keys [own nested orphans]} (page-stats-subtree tree page-id)
                aliases (inspect-page-query-rows aliases)
                aliased-by (inspect-page-query-rows aliases-by)
                alias-uuids (vec (keep #(inspect-page-field % :uuid) aliases))
                alias-of (vec (keep #(inspect-page-field % :uuid) aliased-by))
                by-page (if (number? by-page) by-page 0)
                empty-count (if (number? empty-count) empty-count 0)
                refs (if (number? refs) refs 0)
                tag-holders (if (number? tag-holders) tag-holders 0)
                property-values (count (remove #(inspect-page-structural-property? (first %))
                                                property-rows))
                counts-note (str (- by-page empty-count) " block(s) with content, "
                                 by-page " own block(s) including " empty-count " empty, "
                                 nested " nested page(s), "
                                 (+ refs tag-holders property-values) " inbound reference(s)"
                                 (when (pos? orphans)
                                   (str ", " orphans " ORPHANED block(s)"))
                                 (when (pos? empty-count)
                                   ". content_blocks is the figure to pair with the reference count when judging whether a page is empty; own_blocks counts the empty block createPage seeds and so is never 0 on a page that was created through this API"))
                alias-note (when (or (seq alias-of) (seq alias-uuids))
                             (str "ALIAS RELATION: this page "
                                  (string/join " and "
                                               (remove nil? [(when (seq alias-of)
                                                               (str "is an alias of " (count alias-of) " page(s)"))
                                                             (when (seq alias-uuids)
                                                               (str "declares " (count alias-uuids) " alias(es)"))]))
                                  ". Deleting either side breaks resolution, and `alias` is a built-in property outside this server's writable namespace, so it cannot be restored afterwards. An empty page in an alias relation is NOT a dead stub."
                                  (when (> (count alias-of) 1)
                                    " More than one page claims this one as an alias, which is itself irregular -- read both before touching either.")))
                diagnostic (str (string/replace counts-note #"\.?$" ".")
                                (when alias-note (str " " alias-note)))]
            (bean/->js
             {:page_uuid page-uuid
              :title (inspect-page-field page :title)
              :own_blocks by-page
              :empty_blocks empty-count
              :content_blocks (- by-page empty-count)
              :subtree_blocks (+ own nested orphans)
              :nested_pages nested
              :true_orphans orphans
              :refs refs
              :tag_holders tag-holders
              :property_values property-values
              :is_alias_of (first alias-of)
              :aliases alias-uuids
              :diagnostic diagnostic})))))))

(defn get-page-block-uuids [page-uuid]
  (when-not (util/uuid-string? page-uuid)
    (throw (js/Error. "page_uuid must be a UUID")))
  (let [repo (state/get-current-repo)
        page-uuid* (sdk-utils/uuid-or-throw-error page-uuid)
        tree-query "[:find (pull ?root [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]} {:block/_parent ...}]) . :in $ ?uuid :where [?root :block/uuid ?uuid]]"]
    (p/let [root (<inspect-page-query repo tree-query page-uuid*)]
      (when-not root
        (throw (js/Error. (str "No entity exists with exact UUID " page-uuid))))
      (when-not (inspect-page-field root :name)
        (throw (js/Error. "UUID identifies a block, not a page")))
      (letfn [(descendants [node]
                (mapcat (fn [child]
                          (cons (dissoc child :_parent)
                                (descendants child)))
                        (or (:_parent node) [])))]
        (bean/->js
         (mapv #(assoc % :page_uuid page-uuid)
               (sort-by #(str (:order %)) (descendants root))))))))

(defn- page-block-tree-result [block-uuid root max-depth max-nodes]
  (cond
    (nil? root)
    {:found false :block_uuid block-uuid :block nil :node_count 0 :truncated false}

    (:name root)
    {:found false :block_uuid block-uuid :block nil :node_count 0 :truncated false
     :reason "target is a page, not a block"}

    :else
    (let [count* (atom 0)
          truncated* (atom false)
          visited* (atom #{})]
      (letfn [(build [node depth]
                (when (contains? @visited* (:uuid node))
                  (throw (js/Error. "Block hierarchy contains a cycle")))
                (swap! visited* conj (:uuid node))
                (swap! count* inc)
                (let [children (sort-by #(str (:order %)) (:_parent node))
                      node' (dissoc node :_parent)]
                  (if (or (>= depth max-depth)
                          (>= @count* max-nodes))
                    (do
                      (when (seq children) (reset! truncated* true))
                      (assoc node' :children []))
                    (assoc node' :children
                           (reduce (fn [built child]
                                     (if (< @count* max-nodes)
                                       (conj built (build child (inc depth)))
                                       (do
                                         (reset! truncated* true)
                                         (reduced built))))
                                   [] children)))))]
        {:found true
         :block_uuid block-uuid
         :block (build root 0)
         :node_count @count*
         :truncated @truncated*}))))

(defn get-block-tree [block-uuid max-depth max-nodes]
  (when-not (util/uuid-string? block-uuid)
    (throw (js/Error. "block_uuid must be a UUID")))
  (when-not (and (number? max-depth) (js/Number.isInteger max-depth)
                 (<= 0 max-depth 100))
    (throw (js/Error. "max_depth must be an integer between 0 and 100")))
  (when-not (and (number? max-nodes) (js/Number.isInteger max-nodes)
                 (<= 1 max-nodes 1000))
    (throw (js/Error. "max_nodes must be an integer between 1 and 1000")))
  (let [repo (state/get-current-repo)
        block-uuid* (sdk-utils/uuid-or-throw-error block-uuid)
        tree-query "[:find (pull ?root [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]} {:block/_parent ...}]) . :in $ ?uuid :where [?root :block/uuid ?uuid]]"]
    (p/let [root (<inspect-page-query repo tree-query block-uuid*)]
      (bean/->js (page-block-tree-result block-uuid root max-depth max-nodes)))))

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
             (when block
               (p/let [_ (db-page-handler/add-tag repo (:db/id block) tag)
                       updated-block (db-async/<get-block repo (:db/id block))]
                 (sdk-utils/result->js updated-block))))))

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
