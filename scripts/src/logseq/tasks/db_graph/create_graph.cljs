(ns logseq.tasks.db-graph.create-graph
  "This ns provides fns to create a DB graph using EDN. See `init-conn` for
  initializing a DB graph with a datascript connection that syncs to a sqlite DB
  at the given directory. See `create-blocks-tx` for the EDN format to create a
  graph and current limitations"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.outliner.cli.pipeline :as cli-pipeline]
            [logseq.common.util :as common-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as node-path]
            [nbb.classpath :as cp]
            [logseq.db.frontend.property :as db-property]))

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
    (cli-pipeline/add-listener conn)
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

(defn- ->block-properties-tx [properties uuid-maps all-idents]
  (mapv
   (fn [[prop-name val]]
     (sqlite-util/build-property-pair
      nil
      (get-ident all-idents prop-name)
      ;; set indicates a :many value
      (if (set? val)
        (set (map #(translate-property-value % uuid-maps) val))
        (translate-property-value val uuid-maps))))
   properties))

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

(defn- ->block-tx [m uuid-maps all-idents page-id last-block block-id-fn]
  (merge (dissoc m :properties)
         (sqlite-util/block-with-timestamps
          {:db/id (new-db-id)
           :block/format :markdown
           :block/page {:db/id page-id}
           :block/left {:db/id (if last-block (block-id-fn last-block) page-id)}
           :block/parent {:db/id page-id}})
         (when (seq (:properties m))
           {:block/properties (->block-properties-tx (:properties m) uuid-maps all-idents)
            :block/refs (build-property-refs (:properties m) all-idents)})))

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
                                    {:block/properties (->block-properties-tx props uuid-maps all-idents)
                                     :block/refs (build-property-refs props all-idents)}))]))
                            properties))]
    new-properties-tx))

(defn- validate-options
  [{:keys [pages-and-blocks properties]}]
  (let [undeclared-properties (->> pages-and-blocks
                                   (map #(-> (:blocks %) vec (conj (:page %))))
                                   (mapcat #(->> % (map :properties) (mapcat keys)))
                                   ((fn [x] (set/difference (set x) (set (keys properties))))))
        invalid-pages (remove #(or (:block/original-name %) (:block/name %))
                              (map :page pages-and-blocks))]
    (assert (empty? invalid-pages)
            (str "The following pages did not have a name attribute: " invalid-pages))
    (assert (every? :block/schema (vals properties))
            "All properties must have :block/schema")
    (assert (empty? undeclared-properties)
            (str "The following properties used in EDN were not declared in :properties: " undeclared-properties))))

(defn create-blocks-tx
  "Given an EDN map for defining pages, blocks and properties, this creates a
  vector of transactable data for use with d/transact!. The blocks that can be created
   have the following limitations:

 * Only top level blocks can be easily defined. Other level blocks can be
   defined but they require explicit setting of attributes like :block/left and :block/parent
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
     An additional key `:closed-values` is available to define closed values. The key takes
     a vec of maps containing keys :uuid, :value and :icon.
  * :graph-namespace - namespace to use for db-ident creation. Useful when importing an ontology
  * :page-id-fn - custom fn that returns ent lookup id for page refs e.g. `[:block/original-name X]`
    Default is :db/id
  * :block-id-fn - custom fn that returns ent lookup id for page refs e.g. `[:block/uuid X]`
    Default is :db/id

   The :properties in :pages-and-blocks is a map of property names to property
   values.  Multiple property values for a many cardinality property are defined
   as a set. The following property types are supported: :default, :url,
   :checkbox, :number, :page and :date. :checkbox and :number values are written
   as booleans and integers/floats. :page references are written as
   vectors e.g. `[:page \"PAGE NAME\"]`"
  [{:keys [pages-and-blocks properties graph-namespace page-id-fn block-id-fn]
    :or {page-id-fn :db/id block-id-fn :db/id}
    :as options}]
  (let [_ (validate-options options)
        ;; add uuids before tx for refs in :properties
        pages-and-blocks' (mapv (fn [{:keys [page blocks]}]
                                  (cond-> {:page (merge {:block/uuid (random-uuid)} page)}
                                    (seq blocks)
                                    (assoc :blocks (mapv #(merge {:block/uuid (random-uuid)} %) blocks))))
                                pages-and-blocks)
        uuid-maps (create-uuid-maps pages-and-blocks')
        ;; TODO: How to detect these idents don't conflict with existing? :db/add?
        all-idents (->> (keys properties)
                        (map #(vector %
                                      (if graph-namespace
                                        (db-property/create-db-ident-from-name (str (name graph-namespace) ".property")
                                                                               (name %))
                                        (db-property/create-user-property-ident-from-name (name %)))))
                        (into {}))
        _ (assert (= (count (set (vals all-idents))) (count properties))
                  "All db-idents must be unique")
        new-properties-tx (build-properties-tx properties uuid-maps all-idents)
        pages-and-blocks-tx
        (vec
         (mapcat
          (fn [{:keys [page blocks]}]
            (let [new-page {:db/id (or (:db/id page) (new-db-id))
                            :block/original-name (or (:block/original-name page) (string/capitalize (:block/name page)))
                            :block/name (or (:block/name page) (common-util/page-name-sanity-lc (:block/original-name page)))
                            :block/format :markdown}]
              (into
               ;; page tx
               [(sqlite-util/block-with-timestamps
                 (merge
                  new-page
                  (dissoc page :properties)
                  (when (seq (:properties page))
                    {:block/properties (->block-properties-tx (:properties page) uuid-maps all-idents)})
                  (when (seq (:properties page))
                    {:block/refs (build-property-refs (:properties page) all-idents)
                     ;; app doesn't do this yet but it should to link property to page
                     :block/path-refs (build-property-refs (:properties page) all-idents)})))]
               ;; blocks tx
               (reduce (fn [acc m]
                         (conj acc
                               (->block-tx m uuid-maps all-idents (page-id-fn new-page) (last acc) block-id-fn)))
                       []
                       blocks))))
          pages-and-blocks'))]
    ;; Properties first b/c they have schema. Then pages b/c they can be referenced by blocks
    (vec (concat new-properties-tx
                 (filter :block/name pages-and-blocks-tx)
                 (remove :block/name pages-and-blocks-tx)))))
