(ns logseq.db.sqlite.build
  "This ns provides a concise and readable EDN format to build DB graph tx-data.
  All core concepts including pages, blocks, properties and classes can be
  generated and related to each other without needing to juggle uuids or
  temporary db ids. The generated tx-data is used to create DB graphs that
  persist to sqlite or for testing with in-memory databases. See `Options` for
  the EDN format and `build-blocks-tx` which is the main fn to build tx data"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]
            [malli.core :as m]
            [malli.error :as me]
            [cljs.pprint :as pprint]))

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
  (if (and (qualified-keyword? kw) (db-property/logseq-property? kw))
    kw
    (or (get all-idents kw)
        (throw (ex-info (str "No ident found for " (pr-str kw)) {})))))

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
  "Creates maps of unique page names, block contents and property names to their uuids. Used to
   provide user references for translate-property-value"
  [pages-and-blocks]
  (->> pages-and-blocks
       (map :page)
       (map (juxt :block/original-name :block/uuid))
       (into {})))

(def current-db-id (atom 0))
(def new-db-id
  "Provides the next temp :db/id to use in a create-graph transact!"
  #(swap! current-db-id dec))

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
                     (->> v
                          (map #(db-property-build/build-property-value-block new-block (get-ident all-idents k) %))
                          set)
                     (db-property-build/build-property-value-block new-block (get-ident all-idents k) v))])))
       (into {})))

(defn- extract-content-refs
  "Extracts basic refs from :block/content like `[[foo]]`. Adding more ref support would
  require parsing each block with mldoc and extracting with text/extract-refs-from-mldoc-ast"
  [s]
  ;; FIXME: Better way to ignore refs inside a macro
  (if (string/starts-with? s "{{")
    []
    (map second (re-seq page-ref/page-ref-re s))))

(defn- ->block-tx [{:keys [build/properties] :as m} properties-config page-uuids all-idents page-id]
  (let [new-block {:db/id (new-db-id)
                   :block/format :markdown
                   :block/page {:db/id page-id}
                   :block/order (db-order/gen-key nil)
                   :block/parent (or (:block/parent m) {:db/id page-id})}
        pvalue-tx-m (->property-value-tx-m new-block properties properties-config all-idents)
        ref-names (extract-content-refs (:block/content m))]
    (cond-> []
      ;; Place property values first since they are referenced by block
      (seq pvalue-tx-m)
      (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
      true
      (conj (merge (sqlite-util/block-with-timestamps new-block)
                   (dissoc m :build/properties)
                   (when (seq properties)
                     (->block-properties (merge properties (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                                         page-uuids all-idents))
                   (when (seq ref-names)
                     (let [block-refs (mapv #(hash-map :block/uuid
                                                       (or (page-uuids %)
                                                           (throw (ex-info (str "No uuid for page ref name" (pr-str %)) {})))
                                                       :block/original-name %)
                                            ref-names)]
                       {:block/content (db-content/page-ref->special-id-ref (:block/content m) block-refs)
                        :block/refs (map #(dissoc % :block/original-name) block-refs)})))))))

(defn- build-properties-tx [properties page-uuids all-idents]
  (let [property-db-ids (->> (keys properties)
                             (map #(vector % (new-db-id)))
                             (into {}))
        new-properties-tx (vec
                           (mapcat
                            (fn [[prop-name {:build/keys [schema-classes] :as prop-m}]]
                              (if-let [closed-values (seq (map #(merge {:uuid (random-uuid)} %) (:build/closed-values prop-m)))]
                                (let [db-ident (get-ident all-idents prop-name)]
                                  (db-property-build/build-closed-values
                                   db-ident
                                   prop-name
                                   (assoc prop-m :db/ident db-ident :closed-values closed-values)
                                   {:property-attributes
                                    {:db/id (or (property-db-ids prop-name)
                                                (throw (ex-info "No :db/id for property" {:property prop-name})))}}))
                                (let [new-block
                                      (merge (sqlite-util/build-new-property (get-ident all-idents prop-name)
                                                                             (:block/schema prop-m)
                                                                             {:block-uuid (:block/uuid prop-m)})
                                             {:db/id (or (property-db-ids prop-name)
                                                         (throw (ex-info "No :db/id for property" {:property prop-name})))})
                                      pvalue-tx-m (->property-value-tx-m new-block (:build/properties prop-m) properties all-idents)]
                                  (cond-> []
                                    (seq pvalue-tx-m)
                                    (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
                                    true
                                    (conj
                                     (merge
                                      new-block
                                      (when-let [props (not-empty (:build/properties prop-m))]
                                        (->block-properties (merge props (db-property-build/build-properties-with-ref-values pvalue-tx-m)) page-uuids all-idents))
                                      (when (seq schema-classes)
                                        {:property/schema.classes
                                         (mapv #(hash-map :db/ident (get-ident all-idents %))
                                               schema-classes)})))))))
                            properties))]
    new-properties-tx))

(defn- build-classes-tx [classes properties-config uuid-maps all-idents]
  (let [class-db-ids (->> (keys classes)
                          (map #(vector % (new-db-id)))
                          (into {}))
        classes-tx (vec
                    (mapcat
                     (fn [[class-name {:build/keys [class-parent schema-properties] :as class-m}]]
                       (let [new-block
                             (sqlite-util/build-new-class
                              {:block/name (common-util/page-name-sanity-lc (name class-name))
                               :block/original-name (name class-name)
                               :block/uuid (d/squuid)
                               :db/ident (get-ident all-idents class-name)
                               :db/id (or (class-db-ids class-name)
                                          (throw (ex-info "No :db/id for class" {:class class-name})))})
                             pvalue-tx-m (->property-value-tx-m new-block (:build/properties class-m) properties-config all-idents)]
                         (cond-> []
                           (seq pvalue-tx-m)
                           (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
                           true
                           (conj
                            (merge
                             new-block
                             (dissoc class-m :build/properties :build/class-parent :build/schema-properties)
                             (when-let [props (not-empty (:build/properties class-m))]
                               (->block-properties (merge props (db-property-build/build-properties-with-ref-values pvalue-tx-m)) uuid-maps all-idents))
                             (when class-parent
                               {:class/parent
                                (or (class-db-ids class-parent)
                                    (throw (ex-info (str "No :db/id for " class-parent) {})))})
                             (when schema-properties
                               {:class/schema.properties
                                (mapv #(hash-map :db/ident (get-ident all-idents %))
                                      schema-properties)}))))))
                     classes))]
    classes-tx))

(def Class :keyword)
(def Property :keyword)
(def User-properties [:map-of Property :any])

(def Page-blocks
  [:map
   {:closed true
    ;; Define recursive :block schema
    :registry {::block [:map
                        [:block/content :string]
                        [:build/children {:optional true} [:vector [:ref ::block]]]
                        [:build/properties {:optional true} User-properties]]}}
   [:page [:and
           [:map
            [:block/original-name {:optional true} :string]
            [:build/journal {:optional true} :int]
            [:build/properties {:optional true} User-properties]]
           [:fn {:error/message ":block/original-name or :build/journal required"
                 :error/path [:block/original-name]}
            (fn [m]
              (or (:block/original-name m) (:build/journal m)))]]]
   [:blocks {:optional true} [:vector ::block]]])

(def Properties
  [:map-of
   Property
   [:map
    [:block/schema [:map
                    [:type :keyword]]]
    [:build/properties {:optional true} User-properties]
    [:build/closed-values
     {:optional true}
     [:vector [:map
               [:value [:or :string :double]]
               [:uuid {:optional true} :uuid]
               [:icon {:optional true} :map]]]]
    [:build/schema-classes {:optional true} [:vector Class]]]])

(def Classes
  [:map-of
   Class
   [:map
    [:build/properties {:optional true} User-properties]
    [:build/class-parent {:optional true} Class]
    [:build/schema-properties {:optional true} [:vector Property]]]])

(def Options
  [:map
   {:closed true}
   [:pages-and-blocks {:optional true} [:vector Page-blocks]]
   [:properties {:optional true} Properties]
   [:classes {:optional true} Classes]
   [:graph-namespace {:optional true} :keyword]
   [:page-id-fn {:optional true} :any]])

(defn- validate-options
  [{:keys [pages-and-blocks properties classes] :as options}]
  (when-let [errors (->> options (m/explain Options) me/humanize)]
    (println "The build-blocks-tx has the following options errors:")
    (pprint/pprint errors)
    (throw (ex-info "Options validation failed" {:errors errors})))
  (let [page-block-properties (->> pages-and-blocks
                                   (map #(-> (:blocks %) vec (conj (:page %))))
                                   (mapcat #(->> % (map :build/properties) (mapcat keys)))
                                   set)
        property-class-properties (->> (vals properties)
                                       (concat (vals classes))
                                       (mapcat #(keys (:build/properties %)))
                                       set)
        undeclared-properties (-> page-block-properties
                                  (into property-class-properties)
                                  (set/difference (set (keys properties)))
                                  ((fn [x] (remove db-property/logseq-property? x))))]
    (assert (empty? undeclared-properties)
            (str "The following properties used in EDN were not declared in :properties: " undeclared-properties))))

;; TODO: How to detect these idents don't conflict with existing? :db/add?
(defn- create-all-idents
  [properties classes graph-namespace]
  (let [property-idents (->> (keys properties)
                             (map #(vector %
                                           (if graph-namespace
                                             (db-ident/create-db-ident-from-name (str (name graph-namespace) ".property")
                                                                                 (name %))
                                             (db-property/create-user-property-ident-from-name (name %)))))
                             (into {}))
        _ (assert (= (count (set (vals property-idents))) (count properties)) "All property db-idents must be unique")
        class-idents (->> (keys classes)
                          (map #(vector %
                                        (if graph-namespace
                                          (db-ident/create-db-ident-from-name (str (name graph-namespace) ".class")
                                                                              (name %))
                                          (db-class/create-user-class-ident-from-name (name %)))))
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
                      (dissoc page :build/properties :db/id :block/name :block/original-name))
            pvalue-tx-m (->property-value-tx-m new-page (:build/properties page) properties all-idents)]
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
              (when (seq (:build/properties page))
                (->block-properties (merge (:build/properties page) (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                                    page-uuids
                                    all-idents))))))
         ;; blocks tx
         (reduce (fn [acc m]
                   (into acc
                         (->block-tx m properties page-uuids all-idents (page-id-fn new-page))))
                 []
                 blocks))))
    pages-and-blocks)))

(defn- split-blocks-tx
  "Splits a vec of maps tx into maps that can immediately be transacted,
  :init-tx, and maps that need to be transacted after :init-tx, :block-props-tx, in order to use
   the correct schema e.g. user properties with :db/cardinality"
  [blocks-tx]
  (let [property-idents (keep #(when (:db/cardinality %) (:db/ident %)) blocks-tx)
        [init-tx block-props-tx]
        (reduce (fn [[init-tx* block-props-tx*] m]
                  (let [props (select-keys m property-idents)]
                    [(conj init-tx* (apply dissoc m property-idents))
                     (if (seq props)
                       (conj block-props-tx*
                             (merge {:block/uuid (or (:block/uuid m)
                                                     (throw (ex-info "No :block/uuid for block" {:block m})))}
                                    props))
                       block-props-tx*)]))
                [[] []]
                blocks-tx)]
    {:init-tx init-tx
     :block-props-tx block-props-tx}))

(defn- add-new-pages-from-refs
  [pages-and-blocks]
  (let [existing-pages (->> pages-and-blocks (keep #(get-in % [:page :block/original-name])) set)
        new-pages-from-refs
        (->> pages-and-blocks
             (mapcat
              (fn [{:keys [blocks]}]
                (->> blocks
                     (mapcat #(extract-content-refs (:block/content %)))
                     (remove existing-pages))))
             distinct
             (map #(hash-map :page {:block/original-name %})))]
    (when (seq new-pages-from-refs)
      (println "Building additional pages from content refs:" (pr-str (mapv #(get-in % [:page :block/original-name]) new-pages-from-refs))))
    (concat pages-and-blocks new-pages-from-refs)))

(defn- expand-build-children
  "Expands any blocks with :build/children to return a flattened vec with
  children having correct :block/parent. Also ensures all blocks have a :block/uuid"
  ([data] (expand-build-children data nil))
  ([data parent-id]
   (vec
    (mapcat
     (fn [block]
       (let [block' (cond-> block
                      (not (:block/uuid block))
                      (assoc :block/uuid (random-uuid))
                      true
                      (dissoc :build/children)
                      parent-id
                      (assoc :block/parent {:db/id [:block/uuid parent-id]}))
             children (:build/children block)
             child-maps (when children (expand-build-children children (:block/uuid block')))]
         (cons block' child-maps)))
     data))))

(defn- pre-build-pages-and-blocks
  "Pre builds :pages-and-blocks before any indexes like page-uuids are made"
  [pages-and-blocks]
  (let [ensure-page-uuids (fn [m]
                            (if (get-in m [:page :block/uuid])
                              m
                              (assoc-in m [:page :block/uuid] (random-uuid))))
        expand-block-children (fn [m]
                                (if (:blocks m)
                                  (update m :blocks expand-build-children)
                                  m))
        expand-journal (fn [m]
                         (if-let [date-int (get-in m [:page :build/journal])]
                           (update m :page
                                   (fn [page]
                                     (let [page-name (date-time-util/int->journal-title date-int "MMM do, yyyy")]
                                       (-> (dissoc page :build/journal)
                                           (merge {:block/journal-day date-int
                                                   :block/original-name page-name
                                                   :block/type "journal"})))))
                           m))]
    ;; Order matters as some steps depend on previous step having prepared blocks or pages in a certain way
    (->> pages-and-blocks
         (map expand-journal)
         (map expand-block-children)
         add-new-pages-from-refs
         (map ensure-page-uuids)
         vec)))

(defn- build-blocks-tx*
  [{:keys [pages-and-blocks properties classes graph-namespace]
    :as options}]
  (let [pages-and-blocks' (pre-build-pages-and-blocks pages-and-blocks)
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
    (split-blocks-tx (concat properties-tx'
                             classes-tx
                             pages-and-blocks-tx))))

(defn build-blocks-tx
  "Given an EDN map for defining pages, blocks and properties, this creates a map
 with two keys of transactable data for use with d/transact!. The :init-tx key
 must be transacted first and the :block-props-tx can be transacted after.
 The blocks that can be created have the following limitations:

 * Only top level blocks can be easily defined. Other level blocks can be
   defined but they require explicit setting of :block/parent

   The EDN map has the following keys:

   * :pages-and-blocks - This is a vector of maps containing a :page key and optionally a :blocks
     key when defining a page's blocks. More about each key:
     * :page - This is a datascript attribute map for pages with
       :block/original-name required e.g. `{:block/original/name \"foo\"}`. Additional keys available:
       * :build/journal - Define a journal pages as an integer e.g. 20240101 is Jan 1, 2024. :block/original-name
         is not required if using this since it generates one
       * :build/properties - Defines properties on a page
     * :blocks - This is a vec of datascript attribute maps for blocks with
       :block/content required. e.g. `{:block/content \"bar\"}`. Additional keys available:
       * :build/children - A vec of blocks that are nested (indented) under the current block.
          Allows for outlines to be expressed to whatever depth
       * :build/properties - Defines properties on a block
   * :properties - This is a map to configure properties where the keys are property name keywords
     and the values are maps of datascript attributes e.g. `{:block/schema {:type :checkbox}}`.
     Additional keys available:
     * :build/properties - Define properties on a property page.
     * :build/closed-values - Define closed values with a vec of maps. A map contains keys :uuid, :value and :icon.
     * :build/schema-classes - Vec of class name keywords. Defines a property's range classes
   * :classes - This is a map to configure classes where the keys are class name keywords
     and the values are maps of datascript attributes e.g. `{:block/original-name \"Foo\"}`.
     Additional keys available:
     * :build/properties - Define properties on a class page
     * :build/class-parent - Add a class parent by its keyword name
     * :build/schema-properties - Vec of property name keywords. Defines properties that a class gives to its objects
  * :graph-namespace - namespace to use for db-ident creation. Useful when importing an ontology
  * :page-id-fn - custom fn that returns ent lookup id for page refs e.g. `[:block/uuid X]`
    Default is :db/id

   The :build/properties in :pages-and-blocks, :properties and :classes is a map of
   property name keywords to property values.  Multiple property values for a many
   cardinality property are defined as a set. The following property types are
   supported: :default, :url, :checkbox, :number, :page and :date. :checkbox and
   :number values are written as booleans and integers/floats. :page references
   are written as vectors e.g. `[:page \"PAGE NAME\"]`"
  [options]
  (validate-options options)
  (build-blocks-tx* options))

(defn create-blocks
  "Builds txs with build-blocks-tx and transacts them. Also provides a shorthand
  version of options that are useful for testing"
  [conn options]
  (let [options' (if (vector? options) {:pages-and-blocks options} options)
        {:keys [init-tx block-props-tx]} (build-blocks-tx options')]
    (d/transact! conn init-tx)
    (when (seq block-props-tx)
      (d/transact! conn block-props-tx))))