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
            [logseq.db.frontend.order :as db-order]))

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
  [val {:keys [page-uuids block-uuids]}]
  (if (vector? val)
    (case (first val)
      ;; Converts a page name to block/uuid
      :page
      (if-let [page-uuid (page-uuids (second val))]
        [:block/uuid page-uuid]
        (throw (ex-info (str "No uuid for page '" (second val) "'") {:name (second val)})))
      :block/uuid
      val
      ;; TODO: If not used by :default and replace uuid-maps with just page-uuids everywhere
      :block
      (or (block-uuids (second val))
          (throw (ex-info (str "No uuid for block '" (second val) "'") {:name (second val)})))
      (throw (ex-info "Invalid property value type. Valid values are :block and :page" {})))
    val))

(defn- get-ident [all-idents kw]
  (or (get all-idents kw)
      (throw (ex-info (str "No ident found for " kw) {}))))

(defn- ->block-properties [properties uuid-maps all-idents]
  (->>
   (map
    (fn [[prop-name val]]
      [(get-ident all-idents prop-name)
       ;; set indicates a :many value
       (if (set? val)
         (set (map #(translate-property-value % uuid-maps) val))
         (translate-property-value val uuid-maps))])
    properties)
   (into {})))

(defn- create-uuid-maps
  "Creates maps of unique page names, block contents and property names to their uuids"
  [pages-and-blocks]
  (let [page-uuids (->> pages-and-blocks
                        (map :page)
                        (map (juxt #(or (:block/name %) (common-util/page-name-sanity-lc (:block/original-name %)))
                                   :block/uuid))
                        (into {}))
        block-uuids (->> pages-and-blocks
                         (mapcat :blocks)
                         (map (juxt :block/content :block/uuid))
                         (into {}))]
    {:page-uuids page-uuids
     :block-uuids block-uuids}))

(defn- build-property-refs [properties all-idents]
  (mapv
   (fn [prop-name]
     {:db/ident (get-ident all-idents prop-name)})
   (keys properties)))

(def current-db-id (atom 0))
(def new-db-id
  "Provides the next temp :db/id to use in a create-graph transact!"
  #(swap! current-db-id dec))

(defn- ->block-tx [m uuid-maps all-idents page-id]
  (merge (dissoc m :properties)
         (sqlite-util/block-with-timestamps
          {:db/id (new-db-id)
           :block/format :markdown
           :block/page {:db/id page-id}
           :block/order (db-order/gen-key nil)
           :block/parent {:db/id page-id}})
         (when (seq (:properties m))
           (merge (->block-properties (:properties m) uuid-maps all-idents)
                  {:block/refs (build-property-refs (:properties m) all-idents)}))))

(defn- build-properties-tx [properties uuid-maps all-idents]
  (let [property-db-ids (->> (keys properties)
                             (map #(vector (name %) (new-db-id)))
                             (into {}))
        new-properties-tx (vec
                           (mapcat
                            (fn [[prop-name prop-m]]
                              (if (:closed-values prop-m)
                                (let [db-ident (get-ident all-idents prop-name)]
                                  (db-property-build/build-closed-values
                                   db-ident
                                   prop-name
                                   (assoc prop-m :db/ident db-ident)
                                   {:property-attributes
                                    {:db/id (or (property-db-ids (name prop-name))
                                                (throw (ex-info "No :db/id for property" {:property prop-name})))}}))
                                [(merge
                                  (sqlite-util/build-new-property (get-ident all-idents prop-name)
                                                                  (:block/schema prop-m)
                                                                  {:block-uuid (:block/uuid prop-m)})
                                  {:db/id (or (property-db-ids (name prop-name))
                                              (throw (ex-info "No :db/id for property" {:property prop-name})))}
                                  (when-let [props (not-empty (:properties prop-m))]
                                    (merge
                                     (->block-properties props uuid-maps all-idents)
                                     {:block/refs (build-property-refs props all-idents)})))]))
                            properties))]
    new-properties-tx))

(defn- build-classes-tx [classes uuid-maps all-idents]
  (let [class-db-ids (->> (keys classes)
                          (map #(vector (name %) (new-db-id)))
                          (into {}))
        classes-tx (mapv
                    (fn [[class-name {:keys [class-parent schema-properties] :as class-m}]]
                      (merge
                       (sqlite-util/build-new-class
                        {:block/name (common-util/page-name-sanity-lc (name class-name))
                         :block/original-name (name class-name)
                         :block/uuid (d/squuid)
                         :db/ident (get-ident all-idents class-name)
                         :db/id (or (class-db-ids (name class-name))
                                    (throw (ex-info "No :db/id for class" {:class class-name})))})
                       (dissoc class-m :properties :class-parent :schema-properties)
                       (when-let [props (not-empty (:properties class-m))]
                         (merge
                          (->block-properties props uuid-maps all-idents)
                          {:block/refs (build-property-refs props all-idents)}))
                       (when class-parent
                         {:class/parent
                          (or (class-db-ids class-parent)
                              (throw (ex-info (str "No :db/id for " class-parent) {})))})
                       (when schema-properties
                         {:class/schema.properties
                          (mapv #(hash-map :db/ident (get-ident all-idents (keyword %)))
                                schema-properties)})))
                    classes)]
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
    (assert (every? :block/schema (vals properties))
            "All properties must have :block/schema")
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
  [{:keys [pages-and-blocks properties classes graph-namespace page-id-fn]
    :or {page-id-fn :db/id}
    :as options}]
  (let [_ (validate-options options)
        ;; add uuids before tx for refs in :properties
        pages-and-blocks' (mapv (fn [{:keys [page blocks]}]
                                  (cond-> {:page (merge {:block/uuid (random-uuid)} page)}
                                    (seq blocks)
                                    (assoc :blocks (mapv #(merge {:block/uuid (random-uuid)} %) blocks))))
                                pages-and-blocks)
        uuid-maps (create-uuid-maps pages-and-blocks')
        all-idents (create-all-idents properties classes graph-namespace)
        properties-tx (build-properties-tx properties uuid-maps all-idents)
        classes-tx (build-classes-tx classes uuid-maps all-idents)
        pages-and-blocks-tx
        (vec
         (mapcat
          (fn [{:keys [page blocks]}]
            (let [new-page (merge
                            {:db/id (or (:db/id page) (new-db-id))
                             :block/original-name (or (:block/original-name page) (string/capitalize (:block/name page)))
                             :block/name (or (:block/name page) (common-util/page-name-sanity-lc (:block/original-name page)))
                             :block/format :markdown}
                            (dissoc page :properties :db/id :block/name :block/original-name))]
              (into
               ;; page tx
               [(sqlite-util/block-with-timestamps
                 (merge
                  new-page
                  (when (seq (:properties page))
                    (->block-properties (:properties page) uuid-maps all-idents))
                  (when (seq (:properties page))
                    {:block/refs (build-property-refs (:properties page) all-idents)
                     ;; app doesn't do this yet but it should to link property to page
                     :block/path-refs (build-property-refs (:properties page) all-idents)})))]
               ;; blocks tx
               (reduce (fn [acc m]
                         (conj acc
                               (->block-tx m uuid-maps all-idents (page-id-fn new-page))))
                       []
                       blocks))))
          pages-and-blocks'))]
    ;; Properties first b/c they have schema. Then pages b/c they can be referenced by blocks
    (vec (concat properties-tx
                 classes-tx
                 (filter :block/name pages-and-blocks-tx)
                 (remove :block/name pages-and-blocks-tx)))))
