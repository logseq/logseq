(ns logseq.tasks.db-graph.create-graph
  "This ns provides fns to create a DB graph using EDN. See `init-conn` for
  initializing a DB graph with a datascript connection that syncs to a sqlite DB
  at the given directory. See `create-blocks-tx` for the EDN format to create a
  graph and current limitations"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [logseq.common.util :as common-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as node-path]
            [nbb.classpath :as cp]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn- find-on-classpath [rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split (cp/get-classpath) #":")))

(defn- setup-init-data
  "Setup initial data same as frontend.handler.repo/create-db"
  [conn additional-config]
  (let [config-content
        (cond-> (or (some-> (find-on-classpath "templates/config.edn") fs/readFileSync str)
                    (do (println "Setting graph's config to empty since no templates/config.edn was found.")
                        "{}"))
          additional-config
          ;; TODO: Replace with rewrite-clj when it's available
          (string/replace-first #"(:file/name-format :triple-lowbar)"
                                (str "$1 "
                                     (string/replace-first (str additional-config) #"^\{(.*)\}$" "$1"))))]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data config-content))))

(defn init-conn
  "Create sqlite DB, initialize datascript connection and sync listener and then
  transacts initial data"
  [dir db-name & {:keys [additional-config]}]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true})
  ;; Same order as frontend.db.conn/start!
  (let [conn (sqlite-db/open-db! dir db-name)]
    (db-pipeline/add-listener conn)
    (setup-init-data conn additional-config)
    conn))

(defn- translate-property-value
  "Translates a property value for create-graph edn. A value wrapped in vector
  may indicate a reference type e.g. [:page \"some page\"]"
  [val page-uuids]
  (if (vector? val)
    (case (first val)
      ;; Converts a page name to block/uuid
      :page
      (if-let [page-uuid (page-uuids (second val))]
        [:block/uuid page-uuid]
        (throw (ex-info (str "No uuid for page '" (second val) "'") {:name (second val)})))
      :block/uuid
      val)
    val))

(defn- get-ident [all-idents kw]
  (or (get all-idents kw)
      (throw (ex-info (str "No ident found for " kw) {}))))

(defn- ->block-properties [properties page-uuids all-idents]
  (->>
   (map
    (fn [[prop-name val]]
      [(get-ident all-idents prop-name)
       ;; set indicates a :many value
       (if (set? val)
         (set (map #(translate-property-value % page-uuids) val))
         (translate-property-value val page-uuids))])
    properties)
   (into {})))

(defn- create-page-uuids
  "Creates maps of unique page names, block contents and property names to their uuids"
  [pages-and-blocks]
  (->> pages-and-blocks
       (map :page)
       (map (juxt #(or (:block/name %) (common-util/page-name-sanity-lc (:block/original-name %)))
                  :block/uuid))
       (into {})))

(defn- build-property-refs [properties all-idents]
  (mapv
   (fn [prop-name]
     {:db/ident (get-ident all-idents prop-name)})
   (keys properties)))

(def current-db-id (atom 0))
(def new-db-id
  "Provides the next temp :db/id to use in a create-graph transact!"
  #(swap! current-db-id dec))

(defn- create-property-value
  [block property-ident value]
  (db-property-build/build-property-value-block
   block
   property-ident
   ;; FIXME: Remove when fixed in UI
   (str value)))

;; TODO: Use build-property-values-tx-m
(defn- ->property-value-tx-m
  "Given a new block and its properties, creates a map of properties which have values of property value tx.
   This map is used for both creating the new property values and then adding them to a block"
  [new-block properties properties-config all-idents]
  (->> properties
       (map (fn [[k v]]
              (when (and (db-property-type/value-ref-property-types (get-in properties-config [k :block/schema :type]))
                         ;; TODO: Support translate-property-value without this hack
                         (not (vector? v)))
                [k (if (set? v)
                     (set (map #(create-property-value new-block (get-ident all-idents k) %) v))
                     (create-property-value new-block (get-ident all-idents k) v))])))
       (into {})))

(defn- property-value-properties
  "Converts a property-value-tx map for addition to a block by replacing values with references
   to the property value entities"
  [pvalue-tx]
  (update-vals pvalue-tx
               (fn [v]
                 (if (set? v)
                   (set (map #(vector :block/uuid (:block/uuid %)) v))
                   (vector :block/uuid (:block/uuid v))))))

(defn- ->block-tx [{:keys [properties] :as m} properties-config page-uuids all-idents page-id]
  (let [new-block {:db/id (new-db-id)
                   :block/format :markdown
                   :block/page {:db/id page-id}
                   :block/order (db-order/gen-key nil)
                   :block/parent {:db/id page-id}}
        pvalue-tx-m (->property-value-tx-m new-block properties properties-config all-idents)
        block-props (when (seq properties)
                      (->block-properties (merge properties (property-value-properties pvalue-tx-m))
                                          page-uuids all-idents))]
    (cond-> []
      ;; Place property values first since they are referenced by block
      (seq pvalue-tx-m)
      (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
      true
      (conj (merge (dissoc m :properties)
                   (sqlite-util/block-with-timestamps new-block)
                   (when (seq properties)
                     (merge block-props
                            {:block/refs (build-property-refs properties all-idents)})))))))

(defn- build-properties-tx [properties page-uuids all-idents]
  (let [property-db-ids (->> (keys properties)
                             (map #(vector (name %) (new-db-id)))
                             (into {}))
        new-properties-tx (vec
                           (mapcat
                            (fn [[prop-name {:keys [schema-classes] :as prop-m}]]
                              (if (:closed-values prop-m)
                                (let [db-ident (get-ident all-idents prop-name)]
                                  (db-property-build/build-closed-values
                                   db-ident
                                   prop-name
                                   (assoc prop-m :db/ident db-ident)
                                   {:property-attributes
                                    {:db/id (or (property-db-ids (name prop-name))
                                                (throw (ex-info "No :db/id for property" {:property prop-name})))}}))
                                (let [new-block
                                      (merge (sqlite-util/build-new-property (get-ident all-idents prop-name)
                                                                             (:block/schema prop-m)
                                                                             {:block-uuid (:block/uuid prop-m)})
                                             {:db/id (or (property-db-ids (name prop-name))
                                                         (throw (ex-info "No :db/id for property" {:property prop-name})))})
                                      pvalue-tx-m (->property-value-tx-m new-block (:properties prop-m) properties all-idents)]
                                  (cond-> []
                                    (seq pvalue-tx-m)
                                    (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
                                    true
                                    (conj
                                     (merge
                                      new-block
                                      (when-let [props (not-empty (:properties prop-m))]
                                        (merge
                                         (->block-properties (merge props (property-value-properties pvalue-tx-m)) page-uuids all-idents)
                                         {:block/refs (build-property-refs props all-idents)}))
                                      (when (seq schema-classes)
                                        {:property/schema.classes
                                         (mapv #(hash-map :db/ident (get-ident all-idents %))
                                               schema-classes)})))))))
                            properties))]
    new-properties-tx))

(defn- build-classes-tx [classes properties-config uuid-maps all-idents]
  (let [class-db-ids (->> (keys classes)
                          (map #(vector (name %) (new-db-id)))
                          (into {}))
        classes-tx (vec
                    (mapcat
                     (fn [[class-name {:keys [class-parent schema-properties] :as class-m}]]
                       (let [new-block
                             (->
                              (sqlite-util/build-new-class
                               {:block/name (common-util/page-name-sanity-lc (name class-name))
                                :block/original-name (name class-name)
                                :block/uuid (d/squuid)
                                :db/ident (get-ident all-idents class-name)
                                :db/id (or (class-db-ids (name class-name))
                                           (throw (ex-info "No :db/id for class" {:class class-name})))})
                              ;; TODO: Move this concern to schema script
                              (dissoc :class/parent))
                             pvalue-tx-m (->property-value-tx-m new-block (:properties class-m) properties-config all-idents)]
                         (cond-> []
                           (seq pvalue-tx-m)
                           (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
                           true
                           (conj
                            (merge
                             new-block
                             (dissoc class-m :properties :class-parent :schema-properties)
                             (when-let [props (not-empty (:properties class-m))]
                               (merge
                                (->block-properties (merge props (property-value-properties pvalue-tx-m)) uuid-maps all-idents)
                                ;; TODO: Re-enable when this is also done in the app as this can cause block loading problems
                                #_{:block/refs (build-property-refs props all-idents)}))
                             (when class-parent
                               {:class/parent
                                (or (class-db-ids class-parent)
                                    (throw (ex-info (str "No :db/id for " class-parent) {})))})
                             (when schema-properties
                               {:class/schema.properties
                                (mapv #(hash-map :db/ident (get-ident all-idents (keyword %)))
                                      schema-properties)}))))))
                     classes))]
    classes-tx))


(defn- validate-options
  [{:keys [pages-and-blocks properties classes]}]
  (let [page-block-properties (->> pages-and-blocks
                                   (map #(-> (:blocks %) vec (conj (:page %))))
                                   (mapcat #(->> % (map :properties) (mapcat keys)))
                                   set)
        property-class-properties (->> (vals properties)
                                       (concat (vals classes))
                                       (mapcat #(keys (:properties %)))
                                       set)
        undeclared-properties (-> page-block-properties
                                  (into property-class-properties)
                                  (set/difference (set (keys properties))))
        invalid-pages (remove #(or (:block/original-name %) (:block/name %))
                              (map :page pages-and-blocks))]
    (assert (empty? invalid-pages)
            (str "The following pages did not have a name attribute: " invalid-pages))
    (assert (every? #(get-in % [:block/schema :type]) (vals properties))
            "All properties must have :block/schema and :type")
    (assert (empty? undeclared-properties)
            (str "The following properties used in EDN were not declared in :properties: " undeclared-properties))))

;; TODO: How to detect these idents don't conflict with existing? :db/add?
(defn- create-all-idents
  [properties classes graph-namespace]
  (let [property-idents (->> (keys properties)
                             (map #(vector %
                                           (if graph-namespace
                                             (db-property/create-db-ident-from-name (str (name graph-namespace) ".property")
                                                                                    (name %))
                                             (db-property/create-user-property-ident-from-name (name %)))))
                             (into {}))
        _ (assert (= (count (set (vals property-idents))) (count properties)) "All property db-idents must be unique")
        class-idents (->> (keys classes)
                          (map #(vector %
                                        (if graph-namespace
                                          (db-property/create-db-ident-from-name (str (name graph-namespace) ".class")
                                                                                 (name %))
                                          (db-property/create-db-ident-from-name "user.class" (name %)))))
                          (into {}))
        _ (assert (= (count (set (vals class-idents))) (count classes)) "All class db-idents must be unique")
        all-idents (merge property-idents class-idents)]
    (assert (= (count all-idents) (+ (count property-idents) (count class-idents)))
            "Class and property db-idents have no overlap")
    all-idents))

(defn- build-pages-and-blocks-tx
  [pages-and-blocks all-idents page-uuids {:keys [page-id-fn properties]
                                           :or {page-id-fn :db/id}}]
  (vec
   (mapcat
    (fn [{:keys [page blocks]}]
      (let [new-page (merge
                      {:db/id (or (:db/id page) (new-db-id))
                       :block/original-name (or (:block/original-name page) (string/capitalize (:block/name page)))
                       :block/name (or (:block/name page) (common-util/page-name-sanity-lc (:block/original-name page)))
                       :block/format :markdown}
                      (dissoc page :properties :db/id :block/name :block/original-name))
            pvalue-tx-m (->property-value-tx-m new-page (:properties page) properties all-idents)]
        (into
         ;; page tx
         (cond-> []
           (seq pvalue-tx-m)
           (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
           true
           (conj
            (sqlite-util/block-with-timestamps
             (merge
              new-page
              (when (seq (:properties page))
                (->block-properties (merge (:properties page) (property-value-properties pvalue-tx-m))
                                    page-uuids
                                    all-idents))
              (when (seq (:properties page))
                {:block/refs (build-property-refs (:properties page) all-idents)
                 ;; app doesn't do this yet but it should to link property to page
                 :block/path-refs (build-property-refs (:properties page) all-idents)})))))
         ;; blocks tx
         (reduce (fn [acc m]
                   (into acc
                         (->block-tx m properties page-uuids all-idents (page-id-fn new-page))))
                 []
                 blocks))))
    pages-and-blocks)))

(defn create-blocks-tx
  "Given an EDN map for defining pages, blocks and properties, this creates a
  vector of transactable data for use with d/transact!. The blocks that can be created
   have the following limitations:

 * Only top level blocks can be easily defined. Other level blocks can be
   defined but they require explicit setting of attributes like :block/order and :block/parent
 * Block content containing page refs or tags is not supported yet

   The EDN map has the following keys:

   * :pages-and-blocks - This is a vector of maps containing a :page key and optionally a :blocks
     key when defining a page's blocks. More about each key:
     * :page - This is a datascript attribute map e.g. `{:block/name \"foo\"}` .
       :block/name is required and :properties can be passed to define page properties
     * :blocks - This is a vec of datascript attribute maps e.g. `{:block/content \"bar\"}`.
       :block/content is required and :properties can be passed to define block properties
   * :properties - This is a map to configure properties where the keys are property names
     and the values are maps of datascript attributes e.g. `{:block/schema {:type :checkbox}}`.
     Additional keys available:
     * :closed-values - Define closed values with a vec of maps. A map contains keys :uuid, :value and :icon.
     * :properties - Define properties on a property page.
     * :schema-classes - Vec of class names. Defines a property's range classes
   * :classes - This is a map to configure classes where the keys are class names
     and the values are maps of datascript attributes e.g. `{:block/original-name \"Foo\"}`.
     Additional keys available:
     * :properties - Define properties on a class page
     * :class-parent - Add a class parent by its name
     * :schema-properties - Vec of property names. Defines properties that a class gives to its objects
  * :graph-namespace - namespace to use for db-ident creation. Useful when importing an ontology
  * :page-id-fn - custom fn that returns ent lookup id for page refs e.g. `[:block/uuid X]`
    Default is :db/id

   The :properties in :pages-and-blocks, :properties and :classes is a map of
   property names to property values.  Multiple property values for a many
   cardinality property are defined as a set. The following property types are
   supported: :default, :url, :checkbox, :number, :page and :date. :checkbox and
   :number values are written as booleans and integers/floats. :page references
   are written as vectors e.g. `[:page \"PAGE NAME\"]`"
  [{:keys [pages-and-blocks properties classes graph-namespace]
    :as options}]
  (let [_ (validate-options options)
        ;; add uuids before tx for refs in :properties
        pages-and-blocks' (mapv (fn [{:keys [page blocks]}]
                                  (cond-> {:page (merge {:block/uuid (random-uuid)} page)}
                                    (seq blocks)
                                    (assoc :blocks (mapv #(merge {:block/uuid (random-uuid)} %) blocks))))
                                pages-and-blocks)
        page-uuids (create-page-uuids pages-and-blocks')
        all-idents (create-all-idents properties classes graph-namespace)
        properties-tx (build-properties-tx properties page-uuids all-idents)
        classes-tx (build-classes-tx classes properties page-uuids all-idents)
        class-ident->id (->> classes-tx (map (juxt :db/ident :db/id)) (into {}))
        ;; Replace idents with db-ids to avoid any upsert issues
        properties-tx' (mapv (fn [m]
                               (if (:property/schema.classes m)
                                 (update m :property/schema.classes
                                         (fn [cs]
                                           (mapv #(or (some->> (:db/ident %) class-ident->id (hash-map :db/id))
                                                      (throw (ex-info (str "No :db/id found for :db/ident " (pr-str (:db/ident %))) {})))
                                                 cs)))
                                 m))
                             properties-tx)
        pages-and-blocks-tx (build-pages-and-blocks-tx pages-and-blocks' all-idents page-uuids options)]
    ;; Properties first b/c they have schema and are referenced by all. Then classes b/c they can be referenced by pages. Then pages
    (vec (concat properties-tx'
                 classes-tx
                 pages-and-blocks-tx))))
