(ns logseq.tasks.db-graph.create-graph-with-schema-org
  "Script that converts the jsonld version of schema.org into Logseq classes and
  properties. Initially works with 900 classes and 1368 properties! The script
   currently provides the following in a Logseq graph:
   * All schema.org classes with their name, url, parent class (namespace) and properties
     * Some classes are renamed due to naming conflicts
   * All properties with their property type, url, description
     * Property type is determined by looking for the first range value that is
       a subclass of https://schema.org/DataType and then falling back to :node.
     * Some properties are skipped because they are superseded/deprecated or because they have a property
       type logseq doesnt' support yet
     * schema.org assumes no cardinality. For now, only :node properties are given a :cardinality :many"
  (:require ["fs" :as fs]
            [babashka.cli :as cli]
            [clojure.edn :as edn]
            [clojure.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as w]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.outliner.cli :as outliner-cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

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

(defn- ->class-page [class-m class-properties {:keys [renamed-classes renamed-pages]}]
  (let [parent-classes* (class-m "rdfs:subClassOf")
        parent-classes (cond
                         (map? parent-classes*)
                         [(parent-classes* "@id")]
                         (vector? parent-classes*)
                         (mapv #(get % "@id") parent-classes*)
                         ;; DataTypes are weird in that they are subclassed from
                         ;; rdfs:class but that info is omitted. It seems schema
                         ;; does this on purpose to display it as a separate tree but
                         ;; we want all classes under one tree
                         (contains? (set (as-> (class-m "@type") type'
                                           (if (string? type') [type'] type')))
                                    "schema:DataType")
                         ["schema:DataType"])
        ;; Map of owl:equivalentClass exceptions
        parent-classes' (mapv #(get {"rdfs:Class" "Class"} % %) parent-classes)
        properties (class-properties (class-m "@id"))
        inverted-renamed-classes (set/map-invert renamed-classes)
        class-name (strip-schema-prefix (class-m "@id"))
        url (str "https://schema.org/" (get inverted-renamed-classes class-name class-name))]
    (cond-> {:block/title class-name
             :build/properties (cond-> {:url url}
                                 (class-m "rdfs:comment")
                                 (assoc :logseq.property/description (get-comment-string (class-m "rdfs:comment") renamed-pages)))}
      (seq parent-classes')
      (assoc :build/class-extends (mapv #(keyword (strip-schema-prefix %)) parent-classes'))
      (seq properties)
      (assoc :build/class-properties (mapv (comp keyword strip-schema-prefix) properties)))))

(def schema->logseq-data-types
  "Schema datatypes, https://schema.org/DataType, mapped to their Logseq equivalents"
  {"schema:Integer" :number
   "schema:Float" :number
   "schema:Number" :number
   "schema:Text" :default
   "schema:URL" :url
   "schema:Boolean" :checkbox
   "schema:Date" :date
   "schema:DateTime" :datetime})

(def unsupported-data-types
  "Schema datatypes, https://schema.org/DataType, that don't have Logseq equivalents"
  #{"schema:Time"})

(defn- get-range-includes [property-m]
  (let [range-includes (as-> (property-m "schema:rangeIncludes") range-includes*
                         (map (fn [m] (m "@id"))
                              (if (map? range-includes*) [range-includes*] range-includes*)))]
        ;; Prioritize (sort first) DataType subclasses because they are easier to enter in the app
    (sort-by #(if (schema->logseq-data-types %) -1 1) range-includes)))

(defn- get-schema-type [range-includes class-map]
  (some #(or (schema->logseq-data-types %)
             (when (class-map %) :node))
        range-includes))

(defn- ->property-page [property-m class-map {:keys [verbose renamed-pages]}]
  (let [range-includes (get-range-includes property-m)
        schema-type (get-schema-type range-includes class-map)
        ;; Notify when a property is only using one of the available property types (rangeIncludes)
        ;; Doesn't apply to :node since they do include all rangeIncludes
        _ (when (and verbose (> (count range-includes) 1) (not= schema-type :node))
            (println "Picked property type:"
                     {:property (property-m "@id") :type schema-type :range-includes (vec range-includes)}))
        _ (assert schema-type (str "No schema found for property " (property-m "@id")))
        _ (when (= schema-type :node)
            (when-let [datatype-classes (not-empty (set/intersection (set range-includes)
                                                                     (set (keys schema->logseq-data-types))))]
              (throw (ex-info (str "property " (pr-str (property-m "@id"))
                                   " with type :node has DataType class values which aren't supported: " datatype-classes) {}))))

        url (str "https://schema.org/" (strip-schema-prefix (property-m "@id")))]
    {(keyword (strip-schema-prefix (property-m "@id")))
     (cond-> {:logseq.property/type schema-type
              :build/properties (cond-> {:url url}
                                  (property-m "rdfs:comment")
                                  (assoc :logseq.property/description (get-comment-string (property-m "rdfs:comment") renamed-pages)))}
       ;; This cardinality rule should be adjusted as we use schema.org more
       (= schema-type :node)
       (assoc :db/cardinality :many)
       (= schema-type :node)
       (assoc :build/property-classes (mapv (comp keyword strip-schema-prefix) range-includes)))}))

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
        unsupported-data-types'
        (set/intersection range-includes unsupported-data-types)]
    (and (seq range-includes)
         (every? (fn [x] (contains? unsupported-data-types' x)) range-includes))))

(defn- get-vector-conflicts
  "Given a seq of tuples returns a seq of tuples that conflict i.e. their first element
   has a case sensitive conflict/duplicate with another. An example conflict:
   [[\"schema:status\" :property] [\"schema:status\" :node]]"
  [tuples-seq]
  (->> tuples-seq
       (group-by first)
       (filter #(> (count (val %)) 1))
       vals))

(defn- detect-final-conflicts
  "Does one final detection for conflicts after everything has been renamed"
  [all-classes page-tuples]
  (let [class-ids (map #(vector (% "@id") :class) all-classes)
        existing-conflicts (get-vector-conflicts (concat class-ids page-tuples))]
    (when (seq existing-conflicts) (prn :CONFLICTS existing-conflicts))
    (assert (empty? existing-conflicts)
            "There are no conflicts between existing pages, schema classes and properties")))

;; NOTE: There are currently no class conflicts but if some come up this fn can be updated to exclude built-in properties
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
    (when (seq renamed-classes)
      (if verbose
        (println "Renaming the following classes because they have names that conflict with Logseq's case insensitive :block/name:"
                 (keys renamed-classes) "\n")
        (when (pos? (count renamed-classes))
          (println "Renaming" (count renamed-classes) "classes due to page name conflicts"))))
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

(defn- generate-classes
  [select-classes class-to-properties options]
  (let [classes (->> select-classes
                     (map #(vector (keyword (strip-schema-prefix (get % "@id")))
                                   (->class-page % class-to-properties options)))
                     (into {}))]
    (assert (= ["Thing"] (keep #(when-not (:build/class-extends %)
                                  (:block/title %))
                               (vals classes)))
            "Thing is the only class that doesn't have a schema.org parent class")
    classes))

(defn- generate-properties
  [select-properties class-map options]
  (when (:verbose options)
    (println "Properties by type:"
             (->> select-properties
                  (mapv (fn [property-m]
                          (get-schema-type (get-range-includes property-m) class-map)))
                  frequencies)
             "\n"))
  (assoc
   (apply merge
          (mapv #(->property-page % class-map options) select-properties))
   ;; Have to update schema for now as validation doesn't take into account existing properties
   :logseq.property/description {:logseq.property/public? true
                                 :logseq.property/type :default
                                 :build/properties {:url "https://schema.org/description"
                                                    :logseq.property/description "A description of the item."}}))

(defn- get-all-classes-and-properties
  "Get all classes and properties from raw json file"
  [schema-data existing-pages options]
  (let [;; TODO: See if it's worth pulling in non-types like schema:MusicReleaseFormatType
        all-classes* (filter #(contains? (set (as-> (% "@type") type'
                                                (if (string? type') [type'] type')))
                                         "rdfs:Class")
                             schema-data)
        ;; Use built-in description
        all-properties (remove #(= "schema:description" (% "@id")) (get-all-properties schema-data options))
        property-tuples (map #(vector (% "@id") :property) all-properties)
        class-tuples (map #(vector (% "@id") :class) all-classes*)
        page-tuples (map #(vector (str "schema:" %) :node) existing-pages)
        renamed-classes (detect-id-conflicts-and-get-renamed-classes
                         property-tuples class-tuples page-tuples options)
        ;; Note: schema:description refs don't get renamed but they aren't used
        ;; Updates keys like @id, @subClassOf
        rename-class-ids (fn [m]
                           (w/postwalk (fn [x]
                                         (if-let [new-page (and (map? x) (renamed-classes (x "@id")))]
                                           (merge x {"@id" new-page})
                                           x)) m))
        ;; Updates keys like @id, @rangeIncludes, @domainIncludes
        all-classes (map rename-class-ids all-classes*)]
    (detect-final-conflicts all-classes page-tuples)
    {:all-classes all-classes
     :all-properties all-properties
     :renamed-classes (->> renamed-classes
                           (map (fn [[k v]] [(strip-schema-prefix k) (strip-schema-prefix v)]))
                           (into {}))}))

(defn- create-init-data [existing-pages options]
  (let [schema-data (-> (str (fs/readFileSync "resources/schemaorg-current-https.json"))
                        js/JSON.parse
                        (js->clj)
                        (get "@graph"))
        {:keys [all-classes all-properties renamed-classes]}
        (get-all-classes-and-properties schema-data existing-pages options)
        ;; Generate data shared across pages and properties
        class-map (->> all-classes
                       (map #(vector (% "@id") %))
                       (into {}))
        select-class-ids
        (if (:subset options)
          ["schema:Person" "schema:CreativeWorkSeries" "schema:Organization"
           "schema:Intangible" "schema:Series" "schema:TVSeries" ; Test class multiple inheritance
           "schema:Movie" "schema:CreativeWork" "schema:Thing" "schema:Comment"]
          (keys class-map))
        class-to-properties (get-class-to-properties select-class-ids all-properties)
        select-properties (set (mapcat val class-to-properties))
        options' (assoc options
                        :renamed-classes renamed-classes
                        :renamed-pages renamed-classes)
        ;; Generate pages and properties
        properties (generate-properties
                    (filter #(contains? select-properties (% "@id")) all-properties)
                    class-map options')
        properties'
        (if (:subset options)
          ;; only keep classes that are in subset to keep graph valid
          (let [select-class-ids' (->> select-class-ids (map (comp keyword strip-schema-prefix)) set)]
            (-> properties
                (update-vals (fn [m]
                               (if (:build/property-classes m)
                                 (update m :build/property-classes
                                         (fn [cs] (vec (set (filter #(contains? select-class-ids' %) cs)))))
                                 m)))))
          properties)
        classes (generate-classes
                 (map #(class-map %) select-class-ids)
                 class-to-properties options')]
    {:graph-namespace :schema
     :classes classes
     :properties properties'}))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :config {:alias :c
            :coerce edn/read-string
            :desc "EDN map to add to config.edn"}
   :export {:alias :e
            :desc "Exports graph to schema.edn"}
   :subset {:alias :s
            :desc "Only generate a subset of data for testing purposes"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

(defn- write-export-file [db]
  (let [export-map (sqlite-export/build-export db {:export-type :graph-ontology})]
    (fs/writeFileSync "schema.edn"
                      (with-out-str (pprint/pprint export-map)))))

(defn -main [args]
  (let [[graph-dir] args
        options (cli/parse-opts args {:spec spec})
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        init-conn-args (sqlite-cli/->open-db-args graph-dir)
        db-name (if (= 1 (count init-conn-args)) (first init-conn-args) (second init-conn-args))
        conn (apply outliner-cli/init-conn
                    (conj init-conn-args {:additional-config (:config options)
                                          :classpath (cp/get-classpath)}))
        init-data (create-init-data (d/q '[:find [?name ...] :where [?b :block/name ?name]] @conn)
                                    options)
        {:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx init-data)]
    (println "Generating" (str (count (filter :block/name init-tx)) " pages with "
                               (count (:classes init-data)) " tags and "
                               (count (:properties init-data)) " properties ..."))
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (when (:verbose options) (println "Transacted" (count (d/datoms @conn :eavt)) "datoms"))
    (when (:export options) (write-export-file @conn))
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
