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
  [rdfs-comment renamed-classes]
  (let [desc* (if (map? rdfs-comment)
                (get rdfs-comment "@value")
                rdfs-comment)
        ;; Update refs to renamed classes
        regex (re-pattern (str "\\[\\[(" (string/join "|" (keys renamed-classes)) ")\\]\\]"))
        desc (string/replace desc* regex #(str "[[" (get renamed-classes (second %)) "]]"))]
    ;; Fix markdown and html links to schema website docs
    (string/replace desc #"(\(|\")/docs" "$1https://schema.org/docs")))

(defn- strip-schema-prefix [s]
  (string/replace-first s "schema:" ""))

(defn- ->class-page [class-m class-db-ids class-uuids class-properties property-uuids {:keys [verbose renamed-classes]}]
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
             :properties (cond-> {:url url}
                           (class-m "rdfs:comment")
                           (assoc :description (get-comment-string (class-m "rdfs:comment") renamed-classes)))}
      parent-class
      (assoc :block/namespace {:db/id (get-class-db-id class-db-ids parent-class)})
      (seq properties)
      (assoc :block/schema {:properties (mapv property-uuids properties)}))))

(def schema->logseq-data-types
  "Schema datatypes, https://schema.org/DataType, mapped to their Logseq equivalents"
  {"schema:Integer" :number
   "schema:Float" :number
   "schema:Number" :number
   "schema:Text_Class" :default
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

(defn- ->property-page [property-m prop-uuid class-map class-uuids {:keys [verbose renamed-classes]}]
  (let [range-includes (get-range-includes property-m)
        schema-type (get-schema-type range-includes class-map)
        ;; Pick first range to determine type as only one range is supported currently
        _ (when (and verbose (> (count range-includes) 1))
            (println "Picked property type:"
                     {:property (property-m "@id") :type schema-type :range-includes (vec range-includes)}))
        _ (assert schema-type (str "No schema found for property " (property-m "@id")))
        schema (cond-> {:type schema-type}
                 ;; This cardinality rule should be adjusted as we use schema.org more
                 (= schema-type :page)
                 (assoc :cardinality :many)
                 (property-m "rdfs:comment")
                 (assoc :description (get-comment-string (property-m "rdfs:comment") renamed-classes))
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
     {:block/uuid prop-uuid
      :block/schema schema
      :properties {:url (string/replace-first (property-m "@id") "schema:" "https://schema.org/")}}}))

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

(defn- detect-id-conflicts-and-get-renamed-classes
  "Properties and class names conflict in Logseq because schema.org names are
  case sensitive whereas Logseq's :block/name is case insensitive. This is dealt
  with by appending a '_Class' suffix to conflicting classes.  If this strategy
  changes, be sure to update schema->logseq-data-types"
  [property-ids class-ids {:keys [verbose]}]
  (let [conflicts
        (->> (concat property-ids class-ids)
             (group-by (comp common-util/page-name-sanity-lc first))
             (filter #(> (count (val %)) 1))
             vals)
        ;; If this assertion fails then renamed-classes approach to resolving
        ;; conflicts may need to be revisited
        _ (assert (every? #(= (map second %) [:property :class]) conflicts)
                  "All conflicts are between a property and class")
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
        ;; Looks for all instances of a renamed class and updates them to the renamed class reference
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
  [select-classes class-uuids class-to-properties property-uuids options]
  (let [;; Build db-ids for all classes as they are needed for refs later, across class maps
        class-db-ids (->> select-classes
                          (map #(vector (% "@id") (create-graph/new-db-id)))
                          (into {}))
        pages (mapv #(hash-map :page
                               (->class-page % class-db-ids class-uuids class-to-properties property-uuids options))
                    select-classes)]
    (assert (= ["Thing"] (keep #(when-not (:block/namespace (:page %))
                                  (:block/original-name (:page %)))
                               pages))
            "Thing is the only class that doesn't have a parent class")
    pages))

(defn- generate-properties
  [select-properties property-uuids class-map class-uuids options]
  (when (:verbose options)
    (println "Properties by type:"
             (->> select-properties
                  (mapv (fn [property-m]
                          (get-schema-type (get-range-includes property-m) class-map)))
                  frequencies)
             "\n"))
  (apply merge
         (mapv #(->property-page % (property-uuids (% "@id")) class-map class-uuids options)
               select-properties)))

(defn- get-all-classes-and-properties
  "Get all classes and properties from raw json file"
  [schema-data options]
  (let [;; TODO: See if it's worth pulling in non-types like schema:MusicReleaseFormatType
        all-classes* (filter #(contains? (set (as-> (% "@type") type'
                                                (if (string? type') [type'] type')))
                                         "rdfs:Class")
                             schema-data)
        all-properties* (get-all-properties schema-data options)
        renamed-classes (detect-id-conflicts-and-get-renamed-classes
                         (map #(vector (% "@id") :property) all-properties*)
                         (map #(vector (% "@id") :class) all-classes*)
                         options)
        rename-class-ids (fn [m]
                           (w/postwalk (fn [x]
                                         (if-let [new-class (and (map? x) (renamed-classes (x "@id")))]
                                           (merge x {"@id" new-class})
                                           x)) m))
        ;; Updates keys like @id, @subClassOf
        all-classes (map rename-class-ids all-classes*)
        ;; Updates keys like @id, @rangeIncludes, @domainIncludes
        all-properties (map rename-class-ids all-properties*)]
    {:all-classes all-classes
     :all-properties all-properties
     :renamed-classes (->> renamed-classes
                           (map (fn [[k v]] [(strip-schema-prefix k) (strip-schema-prefix v)]))
                           (into {}))}))

(defn- create-init-data [options]
  (let [schema-data (-> (str (fs/readFileSync "resources/schemaorg-current-https.json"))
                        js/JSON.parse
                        (js->clj)
                        (get "@graph"))
        {:keys [all-classes all-properties renamed-classes]}
        (get-all-classes-and-properties schema-data options)
        ;; Generate data shared across pages and properties
        class-map (->> all-classes
                       (map #(vector (% "@id") %))
                       (into {}))
        select-class-ids (keys class-map)
        ;; Debug: Uncomment to generate a narrower graph of classes
        ;; select-class-ids ["schema:Person" "schema:CreativeWorkSeries"
        ;;                   "schema:Movie" "schema:CreativeWork" "schema:Thing"]
        ;; Generate class uuids as they are needed for properties (:page) and pages
        class-uuids (->> all-classes
                         (map #(vector (% "@id") (random-uuid)))
                         (into {}))
        class-to-properties (get-class-to-properties select-class-ids all-properties)
        select-properties (set (mapcat val class-to-properties))
        ;; Generate property uuids as they are needed for properties and pages (:schema properties)
        property-uuids (->> select-properties
                            (map #(vector % (random-uuid)))
                            (into {}))
        ;; Generate pages and properties
        properties (generate-properties
                    (filter #(contains? select-properties (% "@id")) all-properties)
                    property-uuids class-map class-uuids (assoc options :renamed-classes renamed-classes))
        pages (generate-pages
               (map #(class-map %) select-class-ids)
               class-uuids class-to-properties property-uuids (assoc options :renamed-classes renamed-classes))]
    {:pages-and-blocks pages
     :properties properties}))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

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
        init-data (create-init-data options)
        blocks-tx (create-graph/create-blocks-tx init-data)]
    (println "Generating" (str (count (filter :block/name blocks-tx)) " pages with "
                               (count (:pages-and-blocks init-data)) " classes and "
                               (count (:properties init-data)) " properties ..."))
    (d/transact! conn blocks-tx)
    (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))