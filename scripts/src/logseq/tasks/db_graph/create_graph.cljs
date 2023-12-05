(ns logseq.tasks.db-graph.create-graph
  "This ns provides fns to create a DB graph using EDN. See `init-conn` for
  initializing a DB graph with a datascript connection that syncs to a sqlite DB
  at the given directory. See `create-blocks-tx` for the EDN format to create a
  graph and current limitations"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.outliner.cli.persist-graph :as persist-graph]
            [logseq.db :as ldb]
            [clojure.string :as string]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as node-path]
            [nbb.classpath :as cp]))

(defn- find-on-classpath [rel-path]
  (some (fn [dir]
          (let [f (node-path/join dir rel-path)]
            (when (fs/existsSync f) f)))
        (string/split (cp/get-classpath) #":")))

(defn- setup-init-data
  "Setup initial data same as frontend.handler.repo/create-db"
  [conn]
  ;; App doesn't persist :db/type but it does load it each time
  (d/transact! conn [{:db/id -1 :db/ident :db/type :db/type "db"}])
  (let [config-content (or (some-> (find-on-classpath "templates/config.edn") fs/readFileSync str)
                           (do (println "Setting graph's config to empty since no templates/config.edn was found.")
                               "{}"))]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data config-content))))

(defn init-conn
  "Create sqlite DB, initialize datascript connection and sync listener and then
  transacts initial data"
  [dir db-name]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true})
  (sqlite-db/open-db! dir db-name)
  ;; Same order as frontend.db.conn/start!
  (let [conn (ldb/start-conn :create-default-pages? false)]
    (persist-graph/add-listener conn db-name)
    (ldb/create-default-pages! conn {:db-graph? true})
    (setup-init-data conn)
    conn))

(defn- translate-property-value
  "Translates a property value as needed. A value wrapped in vector indicates a reference type
   e.g. [:page \"some page\"]"
  [val {:keys [page-uuids block-uuids]}]
  (if (vector? val)
    (case (first val)
      :page
      (or (page-uuids (second val))
          (throw (ex-info (str "No uuid for page '" (second val) "'") {:name (second val)})))
      :block
      (or (block-uuids (second val))
          (throw (ex-info (str "No uuid for block '" (second val) "'") {:name (second val)})))
      (throw (ex-info "Invalid property value type. Valid values are :block and :page" {})))
    val))

(defn- ->block-properties-tx [properties {:keys [property-uuids] :as uuid-maps}]
  (->> properties
       (map
        (fn [[prop-name val]]
          [(or (property-uuids prop-name)
               (throw (ex-info "No uuid for property" {:name prop-name})))
            ;; set indicates a :many value
           (if (set? val)
             (set (map #(translate-property-value % uuid-maps) val))
             (translate-property-value val uuid-maps))]))
       (into {})))

(defn- create-uuid-maps
  "Creates maps of unique page names, block contents and property names to their uuids"
  [pages-and-blocks properties]
  (let [property-uuids (->> pages-and-blocks
                            (map #(-> (:blocks %) vec (conj (:page %))))
                            (mapcat #(->> % (map :properties) (mapcat keys)))
                            set
                            (map #(vector % (random-uuid)))
                            ;; TODO: Dedupe with above to avoid squashing a previous definition
                            (concat (map (fn [[k v]]
                                           [k (or (:block/uuid v) (random-uuid))])
                                         properties))
                            (into {}))
        page-uuids (->> pages-and-blocks
                        (map :page)
                        (map (juxt #(or (:block/name %) (sqlite-util/sanitize-page-name (:block/original-name %)))
                                   :block/uuid))
                        (into {}))
        block-uuids (->> pages-and-blocks
                         (mapcat :blocks)
                         (map (juxt :block/content :block/uuid))
                         (into {}))]
    {:property-uuids property-uuids
     :page-uuids page-uuids
     :block-uuids block-uuids}))

(defn- build-property-refs [properties property-db-ids]
  (mapv
   (fn [prop-name]
     {:db/id
      (or (property-db-ids (name prop-name))
          (throw (ex-info (str "No :db/id for property '" prop-name "'") {:property prop-name})))})
   (keys properties)))

(def current-db-id (atom 0))
(def new-db-id
  "Provides the next temp :db/id to use in a create-graph transact!"
  #(swap! current-db-id dec))

(defn- ->block-tx [m uuid-maps property-db-ids page-id last-block]
  (merge (dissoc m :properties)
         (sqlite-util/block-with-timestamps
          {:db/id (new-db-id)
           :block/format :markdown
           :block/page {:db/id page-id}
           :block/left {:db/id (or (:db/id last-block) page-id)}
           :block/parent {:db/id page-id}})
         (when (seq (:properties m))
           {:block/properties (->block-properties-tx (:properties m) uuid-maps)
            :block/refs (build-property-refs (:properties m) property-db-ids)})))

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

   The :properties for :pages-and-blocks is a map of property names to property
   values.  Multiple property values for a many cardinality property are defined
   as a set. The following property types are supported: :default, :url,
   :checkbox, :number, :page and :date. :checkbox and :number values are written
   as booleans and integers. :page and :block are references that are written as
   vectors e.g. `[:page \"PAGE NAME\"]` and `[:block \"block content\"]`
   
   This fn also takes an optional map arg which supports these keys:
   * :property-uuids - A map of property keyword names to uuids to provide ids for built-in properties"
  [{:keys [pages-and-blocks properties]} & {:as options}]
  (let [;; add uuids before tx for refs in :properties
        pages-and-blocks' (mapv (fn [{:keys [page blocks]}]
                                  (cond-> {:page (merge {:block/uuid (random-uuid)} page)}
                                    (seq blocks)
                                    (assoc :blocks (mapv #(merge {:block/uuid (random-uuid)} %) blocks))))
                                pages-and-blocks)
        {:keys [property-uuids] :as uuid-maps} (create-uuid-maps pages-and-blocks' properties)
        property-db-ids (->> property-uuids
                             (map #(vector (name (first %)) (new-db-id)))
                             (into {}))
        new-properties-tx (vec
                           (mapcat
                            (fn [[prop-name uuid]]
                              (if (get-in properties [prop-name :closed-values])
                                (db-property-util/build-closed-values
                                 prop-name
                                 (assoc (get properties prop-name) :block/uuid uuid)
                                 {:icon-id
                                  (get-in options [:property-uuids :icon])
                                  :translate-closed-page-value-fn
                                  #(hash-map :block/uuid (translate-property-value (:value %) uuid-maps))
                                  :property-attributes
                                  {:db/id (or (property-db-ids (name prop-name))
                                              (throw (ex-info "No :db/id for property" {:property prop-name})))}})
                                [(sqlite-util/build-new-property
                                  (merge (db-property-util/new-property-tx prop-name (get-in properties [prop-name :block/schema]) uuid)
                                         {:db/id (or (property-db-ids (name prop-name))
                                                     (throw (ex-info "No :db/id for property" {:property prop-name})))}
                                         (when-let [props (not-empty (get-in properties [prop-name :properties]))]
                                           {:block/properties (->block-properties-tx props uuid-maps)
                                            :block/refs (build-property-refs props property-db-ids)})))]))
                            property-uuids))
        pages-and-blocks-tx
        (vec
         (mapcat
          (fn [{:keys [page blocks]}]
            (let [page-id (or (:db/id page) (new-db-id))]
              (into
               ;; page tx
               [(sqlite-util/block-with-timestamps
                 (merge
                  {:db/id page-id
                   :block/original-name (or (:block/original-name page) (string/capitalize (:block/name page)))
                   :block/name (or (:block/name page) (sqlite-util/sanitize-page-name (:block/original-name page)))
                   :block/journal? false
                   :block/format :markdown}
                  (dissoc page :properties)
                  (when (seq (:properties page))
                    {:block/properties (->block-properties-tx (:properties page) uuid-maps)
                     :block/refs (build-property-refs (:properties page) property-db-ids)
                          ;; app doesn't do this yet but it should to link property to page
                     :block/path-refs (build-property-refs (:properties page) property-db-ids)})))]
               ;; blocks tx
               (reduce (fn [acc m]
                         (conj acc
                               (->block-tx m uuid-maps property-db-ids page-id (last acc))))
                       []
                       blocks))))
          pages-and-blocks'))]
    (into pages-and-blocks-tx new-properties-tx)))