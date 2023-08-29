(ns logseq.tasks.db-graph.create-graph-with-schema-org
  "Script that converts the jsonld version of schema.org into Logseq classes and
  properties. Initially works with 900 classes and 1368 properties"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            ["fs" :as fs]
            [nbb.core :as nbb]
            [clojure.set :as set]
            [clojure.walk :as w]
            [babashka.cli :as cli]))

(def current-db-id (atom 0))
(def new-db-id #(swap! current-db-id dec))

(defn- get-class-db-id [class-db-ids class-id]
  (or (class-db-ids class-id)
      ;; Map of owl:equivalentClass exceptions
      (class-db-ids ({"rdfs:Class" "schema:Class"} class-id))
      (throw (ex-info (str "No :db/id for " class-id) {}))))

(defn- get-class-uuid [class-uuids class-id]
  (or (class-uuids class-id)
      (throw (ex-info (str "No :block/uuid for " class-id) {}))))

(defn- ->class-page [class-m class-db-ids class-uuids class-properties property-uuids {:keys [verbose]}]
  (let [parent-class* (class-m "rdfs:subClassOf")
        parent-class (cond
                       (map? parent-class*)
                       (parent-class* "@id")
                       (vector? parent-class*)
                       (do (when verbose
                             (println "Picked first class for multi-parent class" (pr-str (class-m "@id"))))
                           (get (first parent-class*) "@id")))
        properties (sort (class-properties (class-m "@id")))]
    (cond-> {:block/original-name (string/replace-first (class-m "@id") "schema:" "")
             :block/type "class"
             :block/uuid (get-class-uuid class-uuids (class-m "@id"))
             :db/id (get-class-db-id class-db-ids (class-m "@id"))}
      parent-class
      (assoc :block/namespace {:db/id (get-class-db-id class-db-ids parent-class)})
      (seq properties)
      (assoc :block/schema {:properties (mapv property-uuids properties)}))))

(def schema->logseq-data-types
  {"schema:Integer" :number
   "schema:Float" :number
   "schema:Number" :number
   "schema:Text" :default
   "schema:URL" :url
   "schema:Boolean" :checkbox
   "schema:Date" :date})

(defn- ->property-page [property-m prop-uuid class-map class-uuids]
  (let [range-includes (as-> (property-m "schema:rangeIncludes") range-includes*
                         (map (fn [m] (m "@id"))
                              (if (map? range-includes*) [range-includes*] range-includes*)))
        ;; Pick first range to determine type as only one range is supported currently
        schema-type (some #(or (schema->logseq-data-types %)
                               (when (class-map %) :object))
                          range-includes)
        _ (assert schema-type (str "No schema found for property " (property-m "@id")))
        schema (cond-> {:type schema-type}
                 (property-m "rdfs:comment")
                 (assoc :description (property-m "rdfs:comment"))
                 (= schema-type :object)
                 (assoc :class (or (some class-uuids range-includes)
                                   (throw (ex-info (str "No uuids found for range(s): " range-includes) {})))))]
    {(keyword (string/replace-first (property-m "@id") "schema:" ""))
     {:block/uuid prop-uuid
      :block/schema schema}}))

(def unsupported-data-types
  "Schema datatypes, https://schema.org/DataType, that don't have Logseq equivalents"
  #{"schema:Time" "schema:DateTime"})

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
  [property-ids class-ids]
  (let [conflicts
        (->> (concat property-ids class-ids)
             (group-by (comp string/lower-case first))
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
    renamed-classes))

(defn- get-all-properties [schema-data {:keys [verbose]}]
  (let [all-properties** (filter #(= "rdf:Property" (% "@type")) schema-data)
        [superseded-properties all-properties*] ((juxt filter remove) #(% "schema:supersededBy") all-properties**)
        _ (if verbose
            (println "Skipping the following superseded properties:" (mapv #(% "@id") superseded-properties))
            (println "Skipping" (count superseded-properties) "superseded properties"))
        [unsupported-properties all-properties] ((juxt filter remove) property-with-unsupported-type? all-properties*)
        _ (if verbose
            (println "Skipping the following unsupported properties:" (mapv #(% "@id") unsupported-properties))
            (println "Skipping" (count unsupported-properties) "properties with unsupported data types"))]
    all-properties))

(defn create-init-data [options]
  (let [schema-data (-> (str (fs/readFileSync "resources/schemaorg-current-https.json"))
                        js/JSON.parse
                        (js->clj)
                        (get "@graph"))
        ;; TODO: See if it's worth pulling in non-types like schema:MusicReleaseFormatType
        all-classes* (filter #(contains? (set (as-> (% "@type") type'
                                                (if (string? type') [type'] type')))
                                         "rdfs:Class")
                             schema-data)
        all-properties* (get-all-properties schema-data options)
        renamed-classes (detect-id-conflicts-and-get-renamed-classes
                         (map #(vector (% "@id") :property) all-properties*)
                         (map #(vector (% "@id") :class) all-classes*))
        _ (if (:verbose options)
            (println "Renaming the following classes because they have property names that conflict with Logseq's case insensitive :block/name:"
                     (keys renamed-classes))
            (println "Renaming" (count renamed-classes) "classes due to page name conflicts"))
        ;; Looks for all instances of a renamed class and updates them to the renamed class reference
        rename-class-ids (fn [m]
                           (w/postwalk (fn [x]
                                         (if-let [new-class (and (map? x) (renamed-classes (x "@id")))]
                                           (merge x {"@id" new-class})
                                           x)) m))
        ;; Updates keys like @id, @subClassOf
        all-classes (map rename-class-ids all-classes*)
        ;; Updates keys like @id, @rangeIncludes, @domainIncludes
        all-properties (map rename-class-ids all-properties*)
        class-map (->> all-classes
                       (map #(vector (% "@id") %))
                       (into {}))
        property-map (->> all-properties
                          (map #(vector (% "@id") %))
                          (into {}))
        select-class-ids (keys class-map)
        ;; Debug: Uncomment to generate a narrower graph of classes
        ;; select-class-ids ["schema:Person" "schema:CreativeWorkSeries"
        ;;                   "schema:Movie" "schema:CreativeWork" "schema:Thing"]
        select-classes (map #(class-map %) select-class-ids)
        ;; Build db-ids for all classes as they are needed for refs later, across class maps
        class-db-ids (->> select-classes
                          (map #(vector (% "@id") (new-db-id)))
                          (into {}))
        ;; Generate all uuids as they are needed for properties and pages
        class-uuids (->> all-classes
                         (map #(vector (% "@id") (random-uuid)))
                         (into {}))
        class-to-properties (get-class-to-properties select-class-ids all-properties)
        select-properties (mapcat val class-to-properties)
        ;; Build property uuids as they are needed for properties and pages
        property-uuids (->> select-properties
                            (map #(vector % (random-uuid)))
                            (into {}))
        properties-config (apply merge
                                 (mapv #(->property-page (property-map %) (property-uuids %) class-map class-uuids)
                                       select-properties))
        pages (mapv #(hash-map :page (->class-page % class-db-ids class-uuids class-to-properties property-uuids options))
                    select-classes)]
    {:pages-and-blocks pages
     :properties properties-config}))

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
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))