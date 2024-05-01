(ns logseq.tasks.db-graph.create-graph-with-schema-org
  "Script that converts the jsonld version of schema.org into Logseq classes and
  properties. Initially works with 900 classes and 1368 properties! The script
   currently provides the following in a Logseq graph:
   * All schema.org classes with their name, url, parent class (namespace) and properties
     * Some classes are renamed due to naming conflicts
   * All properties with their property type, url, description
     * Property type is determined by looking for the first range value that is
       a subclass of https://schema.org/DataType and then falling back to :page.
     * Some properties are skipped because they are superseded/deprecated or because they have a property
       type logseq doesnt' support yet
     * schema.org assumes no cardinality. For now, only :page properties are given a :cardinality :many"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            ["fs" :as fs]
            [nbb.core :as nbb]
            [clojure.set :as set]
            [clojure.walk :as w]
            [babashka.cli :as cli]))

(defn- get-class-db-id [class-db-ids class-id]
  (or (class-db-ids class-id)
      ;; Map of owl:equivalentClass exceptions
      (class-db-ids ({"rdfs:Class" "schema:Class"} class-id))
      (throw (ex-info (str "No :db/id for " class-id) {}))))

(defn- get-class-uuid [class-uuids class-id]
  (or (class-uuids class-id)
      (throw (ex-info (str "No :block/uuid for " class-id) {}))))

(defn- get-comment-string
  [rdfs-comment renamed-pages]
  (let [desc* (if (map? rdfs-comment)
                (get rdfs-comment "@value")
                rdfs-comment)
        ;; Update refs to renamed classes
        regex (re-pattern (str "\\[\\[(" (string/join "|" (keys renamed-pages)) ")\\]\\]"))
        desc (string/replace desc* regex #(str "[[" (get renamed-pages (second %)) "]]"))]
    ;; Fix markdown and html links to schema website docs
    (string/replace desc #"(\(|\")/docs" "$1https://schema.org/docs")))

(defn- strip-schema-prefix [s]
  (string/replace-first s "schema:" ""))

(defn- ->class-page [class-m class-db-ids class-uuids class-properties {:keys [verbose renamed-classes renamed-pages]}]
  (let [parent-class* (class-m "rdfs:subClassOf")
        parent-class (cond
                       (map? parent-class*)
                       (parent-class* "@id")
                       (vector? parent-class*)
                       (do (when verbose
                             (println "Picked first class for multi-parent class" (pr-str (class-m "@id"))))
                           (get (first parent-class*) "@id"))
                       ;; DataTypes are weird in that they are subclassed from
                       ;; rdfs:class but that info is omitted. It seems schema
                       ;; does this on purpose to display it as a separate tree but
                       ;; we want all classes under one tree
                       (contains? (set (as-> (class-m "@type") type'
                                         (if (string? type') [type'] type')))
                                  "schema:DataType")
                       "schema:DataType")
        properties (sort (class-properties (class-m "@id")))
        inverted-renamed-classes (set/map-invert renamed-classes)
        class-name (strip-schema-prefix (class-m "@id"))
        url (str "https://schema.org/" (get inverted-renamed-classes class-name class-name))]
    (cond-> {:block/original-name class-name
             :block/type "class"
             :block/uuid (get-class-uuid class-uuids (class-m "@id"))
             :db/id (get-class-db-id class-db-ids (class-m "@id"))
             ;; TODO: Use config when this is in create-graph
             :db/ident (db-property/create-db-ident-from-name "schema.class" class-name)
             :properties (cond-> {:url url}
                           (class-m "rdfs:comment")
                           (assoc :description (get-comment-string (class-m "rdfs:comment") renamed-pages)))}
      parent-class
      (assoc :class/parent {:db/id (get-class-db-id class-db-ids parent-class)})
      (seq properties)
      ;; TODO: Remove ident create when able to fetch existing property ident
      (assoc :class/schema.properties (mapv #(hash-map :db/ident
                                                       (db-property/create-db-ident-from-name "schema.property" %))
                                            (map strip-schema-prefix properties))))))

(def schema->logseq-data-types
  "Schema datatypes, https://schema.org/DataType, mapped to their Logseq equivalents"
  {"schema:Integer" :number
   "schema:Float" :number
   "schema:Number" :number
   "schema:Text_Class" :string
   "schema:URL_Class" :url
   "schema:Boolean" :checkbox
   "schema:Date" :date})

(def unsupported-data-types
  "Schema datatypes, https://schema.org/DataType, that don't have Logseq equivalents"
  #{"schema:Time" "schema:DateTime"})

(defn- get-range-includes [property-m]
  (let [range-includes (as-> (property-m "schema:rangeIncludes") range-includes*
                         (map (fn [m] (m "@id"))
                              (if (map? range-includes*) [range-includes*] range-includes*)))]
        ;; Prioritize (sort first) DataType subclasses because they are easier to enter in the app
    (sort-by #(if (schema->logseq-data-types %) -1 1) range-includes)))

(defn- get-schema-type [range-includes class-map]
  (some #(or (schema->logseq-data-types %)
             (when (class-map %) :page))
        range-includes))

(defn- ->property-page [property-m class-map class-uuids {:keys [verbose renamed-pages renamed-properties]}]
  (let [range-includes (get-range-includes property-m)
        schema-type (get-schema-type range-includes class-map)
        ;; Pick first range to determine type as only one range is supported currently
        _ (when (and verbose (> (count range-includes) 1))
            (println "Picked property type:"
                     {:property (property-m "@id") :type schema-type :range-includes (vec range-includes)}))
        _ (assert schema-type (str "No schema found for property " (property-m "@id")))
        inverted-renamed-properties (set/map-invert renamed-properties)
        class-name (strip-schema-prefix (property-m "@id"))
        url (str "https://schema.org/" (get inverted-renamed-properties class-name class-name))
        schema (cond-> {:type schema-type}
                 ;; This cardinality rule should be adjusted as we use schema.org more
                 (= schema-type :page)
                 (assoc :cardinality :many)
                 (property-m "rdfs:comment")
                 (assoc :description (get-comment-string (property-m "rdfs:comment") renamed-pages))
                 (= schema-type :page)
                 (assoc :classes (let [invalid-classes (remove class-uuids range-includes)
                                       _ (when (seq invalid-classes)
                                           (throw (ex-info (str "No uuids found for range(s): " invalid-classes) {})))
                                       datatype-classes (set/intersection (set range-includes) (set (keys schema->logseq-data-types)))
                                       _ (when (seq datatype-classes)
                                           (throw (ex-info (str "property " (pr-str (property-m "@id"))
                                                                " has DataType class values which aren't supported: " datatype-classes) {})))]
                                   (set (map class-uuids range-includes)))))]
    {(keyword (strip-schema-prefix (property-m "@id")))
     {:block/schema schema
      :properties {:url url}}}))

(defn- get-class-to-properties
  "Given a vec of class ids and a vec of properties map to process, return a map of
  class ids to their property ids"
  [all-classes all-properties]
  (let [;; build map of class id to all their properties
        all-class-properties (reduce
                              (fn [acc prop]
                                (let [domains* (prop "schema:domainIncludes")
                                      domains (if (map? domains*) [domains*] domains*)]
                                  (merge-with into
                                              acc
                                              (->> domains
                                                   (map (fn [class] (vector (class "@id") [(prop "@id")])))
                                                   (into {})))))
                              {}
                              all-properties)]
    (->> all-classes
         (map #(vector % (vec (all-class-properties %))))
         (into {}))))

(defn property-with-unsupported-type? [prop]
  (let [range-includes
        (as-> (prop "schema:rangeIncludes") range-includes*
          (set (map (fn [m] (m "@id")) (if (map? range-includes*) [range-includes*] range-includes*))))
        unsupported-data-types
        (set/intersection range-includes unsupported-data-types)]
    (and (seq range-includes)
         (every? (fn [x] (contains? unsupported-data-types x)) range-includes))))

(defn- get-vector-conflicts
  "Given a seq of tuples returns a seq of tuples that conflict i.e. their first element
   has a case insensitive conflict/duplicate with another. An example conflict:
   [[\"schema:businessFunction\" :property] [\"schema:BusinessFunction\" :class]]"
  [tuples-seq]
  (->> tuples-seq
       (group-by (comp common-util/page-name-sanity-lc first))
       (filter #(> (count (val %)) 1))
       vals))

(defn- detect-final-conflicts
  "Does one final detection for conflicts after everything has been renamed"
  [all-properties all-classes page-tuples]
  (let [property-ids (map #(vector (% "@id") :property) all-properties)
        class-ids (map #(vector (% "@id") :class) all-classes)
        existing-conflicts (get-vector-conflicts (concat property-ids class-ids page-tuples))]
    (when (seq existing-conflicts) (prn :CONFLICTS existing-conflicts))
    (assert (empty? existing-conflicts)
            "There are no conflicts between existing pages, schema classes and properties")))

(defn- detect-property-conflicts-and-get-renamed-properties
  "Detects conflicts between properties and existing pages and returns renamed properties"
  [property-ids existing-pages {:keys [verbose]}]
  (let [conflicts (get-vector-conflicts (concat property-ids existing-pages))
        _ (assert (every? #(= 2 (count %)) conflicts) "All conflicts must only be between two elements")
        renamed-properties (->> conflicts
                                (map #(-> % second first))
                                ;; Renaming properties '_property' suffix guarantees uniqueness
                                ;; b/c schema.org doesn't use '_' in their names
                                (map #(vector % (str % "_property")))
                                (into {}))]
    (if verbose
      (println "Renaming the following properties because they have names that conflict with Logseq's built in pages"
               (keys renamed-properties) "\n")
      (println "Renaming" (count renamed-properties) "properties due to page name conflicts"))
    renamed-properties))

(defn- detect-id-conflicts-and-get-renamed-classes
  "Detects conflicts between classes AND properties and existing
  pages. Renames any detected conflicts. Properties and class names conflict in
  Logseq because schema.org names are case sensitive whereas Logseq's
  :block/name is case insensitive. This is dealt with by appending a '_Class'
  suffix to conflicting classes.  If this strategy changes, be sure to update
  schema->logseq-data-types"
  [property-ids class-ids existing-pages {:keys [verbose]}]
  (let [conflicts (get-vector-conflicts (concat property-ids class-ids))
        ;; If this assertion fails then renamed-classes approach to resolving
        ;; conflicts may need to be revisited
        _ (assert (every? #(= 2 (count %)) conflicts) "All conflicts must only be between two elements")
        existing-conflicts (get-vector-conflicts (concat class-ids existing-pages))
        _ (when (seq existing-conflicts) (prn :EXISTING-CLASS-CONFLICTS existing-conflicts))
        ;; Add existing-conflicts to conflicts if this ever fails
        _ (assert (empty? existing-conflicts)
                  "There are no conflicts between existing pages and schema classes and properties")
        renamed-classes (->> conflicts
                             (map #(-> % second first))
                             ;; Renaming classes with '_Class' suffix guarantees uniqueness
                             ;; b/c schema.org doesn't use '_' in their names
                             (map #(vector % (str % "_Class")))
                             (into {}))]
    (if verbose
      (println "Renaming the following classes because they have property names that conflict with Logseq's case insensitive :block/name:"
               (keys renamed-classes) "\n")
      (println "Renaming" (count renamed-classes) "classes due to page name conflicts"))
    renamed-classes))

(defn- get-all-properties [schema-data {:keys [verbose]}]
  (let [all-properties** (filter #(= "rdf:Property" (% "@type")) schema-data)
        [superseded-properties all-properties*] ((juxt filter remove) #(% "schema:supersededBy") all-properties**)
        _ (if verbose
            (println "Skipping the following superseded properties:" (mapv #(% "@id") superseded-properties) "\n")
            (println "Skipping" (count superseded-properties) "superseded properties"))
        [unsupported-properties all-properties] ((juxt filter remove) property-with-unsupported-type? all-properties*)
        _ (if verbose
            (println "Skipping the following unsupported properties:" (mapv #(% "@id") unsupported-properties) "\n")
            (println "Skipping" (count unsupported-properties) "properties with unsupported data types"))]
    all-properties))

(defn- generate-pages
  [select-classes class-uuids class-to-properties options]
  (let [;; Build db-ids for all classes as they are needed for refs later, across class maps
        class-db-ids (->> select-classes
                          (map #(vector (% "@id") (create-graph/new-db-id)))
                          (into {}))
        pages (mapv #(hash-map :page
                               (->class-page % class-db-ids class-uuids class-to-properties options))
                    select-classes)]
    (assert (= ["Thing"] (keep #(when-not (:class/parent (:page %))
                                  (:block/original-name (:page %)))
                               pages))
            "Thing is the only class that doesn't have a parent class")
    pages))

(defn- generate-properties
  [select-properties class-map class-uuids options]
  (when (:verbose options)
    (println "Properties by type:"
             (->> select-properties
                  (mapv (fn [property-m]
                          (get-schema-type (get-range-includes property-m) class-map)))
                  frequencies)
             "\n"))
  (apply merge
         (mapv #(->property-page % class-map class-uuids options)
               select-properties)))

(defn- get-all-classes-and-properties
  "Get all classes and properties from raw json file"
  [schema-data existing-pages options]
  (let [;; TODO: See if it's worth pulling in non-types like schema:MusicReleaseFormatType
        all-classes* (filter #(contains? (set (as-> (% "@type") type'
                                                (if (string? type') [type'] type')))
                                         "rdfs:Class")
                             schema-data)
        all-properties* (get-all-properties schema-data options)
        property-tuples (map #(vector (% "@id") :property) all-properties*)
        class-tuples (map #(vector (% "@id") :class) all-classes*)
        page-tuples (map #(vector (str "schema:" %) :page) existing-pages)
        renamed-classes (detect-id-conflicts-and-get-renamed-classes
                         property-tuples class-tuples page-tuples options)
        renamed-properties (detect-property-conflicts-and-get-renamed-properties
                            property-tuples page-tuples options)
        renamed-pages (merge renamed-classes renamed-properties)
        ;; Updates keys like @id, @subClassOf
        rename-page-ids (fn [m]
                          (w/postwalk (fn [x]
                                        (if-let [new-page (and (map? x) (renamed-pages (x "@id")))]
                                          (merge x {"@id" new-page})
                                          x)) m))
        ;; Updates keys like @id, @rangeIncludes, @domainIncludes
        all-classes (map rename-page-ids all-classes*)
        all-properties (map rename-page-ids all-properties*)]
    (detect-final-conflicts all-properties all-classes page-tuples)
    {:all-classes all-classes
     :all-properties all-properties
     :renamed-properties (->> renamed-properties
                              (map (fn [[k v]] [(strip-schema-prefix k) (strip-schema-prefix v)]))
                              (into {}))
     :renamed-classes (->> renamed-classes
                           (map (fn [[k v]] [(strip-schema-prefix k) (strip-schema-prefix v)]))
                           (into {}))}))

(defn- create-init-data [existing-pages options]
  (let [schema-data (-> (str (fs/readFileSync "resources/schemaorg-current-https.json"))
                        js/JSON.parse
                        (js->clj)
                        (get "@graph"))
        {:keys [all-classes all-properties renamed-classes renamed-properties]}
        (get-all-classes-and-properties schema-data existing-pages options)
        ;; Generate data shared across pages and properties
        class-map (->> all-classes
                       (map #(vector (% "@id") %))
                       (into {}))
        select-class-ids (keys class-map)
        ;; Debug: Uncomment to generate a narrower graph of classes
        ;; select-class-ids ["schema:Person" "schema:CreativeWorkSeries"
        ;;                   "schema:Organization"
        ;;                   "schema:Movie" "schema:CreativeWork" "schema:Thing"]
        ;; select-class-ids ["schema:Thing"]
        ;; Generate class uuids as they are needed for properties (:page) and pages
        class-uuids (->> all-classes
                         (map #(vector (% "@id") (random-uuid)))
                         (into {}))
        class-to-properties (get-class-to-properties select-class-ids all-properties)
        select-properties (set (mapcat val class-to-properties))
        options' (assoc options
                        :renamed-classes renamed-classes
                        :renamed-properties renamed-properties
                        :renamed-pages (merge renamed-properties renamed-classes))
        ;; Generate pages and properties
        properties (generate-properties
                    (filter #(contains? select-properties (% "@id")) all-properties)
                    class-map class-uuids options')
        pages (generate-pages
               (map #(class-map %) select-class-ids)
               class-uuids class-to-properties options')]
    {:graph-namespace :schema
     :pages-and-blocks pages
     :properties properties}))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :debug {:alias :d
           :desc "Prints additional debug info and a schema.edn for debugging"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

(defn- write-debug-file [blocks-tx db]
  (let [block-uuid->name* (->> (d/q '[:find (pull ?b [:block/original-name :block/uuid]) :where [?b :block/original-name]] db)
                               (map first)
                               (map (juxt :block/uuid :block/original-name))
                               (into {}))
        block-uuid->name #(or (block-uuid->name* %) (throw (ex-info (str "No entity found for " %) {})))
        db-ident->name* (->> (d/q '[:find (pull ?b [:block/original-name :db/ident]) :where [?b :db/ident]] db)
                             (map first)
                             (map (juxt :db/ident :block/original-name))
                             (into {}))
        db-ident->name #(or (db-ident->name* %) (throw (ex-info (str "No entity found for " %) {})))]
    (fs/writeFileSync "schema-org.edn"
                      (pr-str
                       (->> blocks-tx
                            (map (fn [m]
                                   (let [props (db-property/properties m)]
                                     (cond-> (select-keys m [:block/name :block/type :block/original-name :block/schema])
                                       (seq props)
                                       (assoc :block/properties (update-keys props name))
                                       (seq (:class/schema.properties m))
                                       (assoc-in [:block/schema :properties] (mapv db-ident->name
                                                                                   (map :db/ident (:class/schema.properties m))))
                                       (seq (get-in m [:block/schema :classes]))
                                       (update-in [:block/schema :classes] #(mapv block-uuid->name %))))))
                            set)))))

(defn -main [args]
  (let [[graph-dir] args
        options (cli/parse-opts args {:spec spec})
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (create-graph/init-conn dir db-name)
        init-data (create-init-data (d/q '[:find [?name ...] :where [?b :block/name ?name]] @conn)
                                    options)
        blocks-tx (create-graph/create-blocks-tx init-data)]
    (println "Generating" (str (count (filter :block/name blocks-tx)) " pages with "
                               (count (:pages-and-blocks init-data)) " classes and "
                               (count (:properties init-data)) " properties ..."))
    (d/transact! conn blocks-tx)
    (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
    (when (:debug options) (write-debug-file blocks-tx @conn))
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
