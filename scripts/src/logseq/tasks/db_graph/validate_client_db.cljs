(ns logseq.tasks.db-graph.validate-client-db
  "Script that validates the datascript db of a db graph"
  (:require [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.schema :as db-schema]
            [logseq.db.property :as db-property]
            [logseq.db.property.type :as db-property-type]
            [datascript.core :as d]
            [clojure.string :as string]
            [nbb.core :as nbb]
            [clojure.pprint :as pprint]
            [clojure.walk :as walk]
            [malli.core :as m]
            [babashka.cli :as cli]
            ["path" :as node-path]
            ["os" :as os]
            [cljs.pprint :as pprint]))

(defn- validate-property-value
  "Validates the value in a property tuple. The property value can be one or
  many of a value to validated"
  [prop-type schema-fn val]
  (if (and (or (sequential? val) (set? val))
           (not= :coll prop-type))
    (every? schema-fn val)
    (schema-fn val)))

(def property-tuple
  "Represents a tuple of a property and its property value. This schema
   has 2 metadata hooks which are used to inject a datascript db later"
  (into
   [:multi {:dispatch ^:add-db (fn [db property-tuple]
                                 (get-in (d/entity db [:block/uuid (first property-tuple)])
                                         [:block/schema :type]))}]
   (map (fn [[prop-type value-schema]]
          ^:property-value [prop-type (if (vector? value-schema) (last value-schema) value-schema)])
        db-property-type/builtin-schema-types)))

(def block-properties
  "Validates a slightly modified verson of :block/properties. Properties are
  expected to be a vector of tuples instead of a map in order to validate each
  property with its property value that is valid for its type"
  [:sequential property-tuple])

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/properties {:optional true}
    block-properties]
   [:block/refs {:optional true} [:set :int]]
   [:block/tags {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/original-name :string]
   [:block/type {:optional true} [:enum #{"property"} #{"class"} #{"object"} #{"whiteboard"} #{"hidden"}]]
   [:block/journal? :boolean]
    ;; TODO: Consider moving to just normal and class after figuring out journal attributes
   [:block/format {:optional true} [:enum :markdown]]
    ;; TODO: Should this be here or in common?
   [:block/path-refs {:optional true} [:set :int]]])

(def normal-page
  (vec
   (concat
    [:map {:closed false}]
    page-attrs
    ;; journal-day is only set for journal pages
    [[:block/journal-day {:optional true} :int]
     [:block/namespace {:optional true} :int]]
    page-or-block-attrs)))

(def object-page
  (vec
   (concat
    [:map {:closed false}]
    [[:block/collapsed? {:optional true} :boolean]
     [:block/tags [:set :int]]]
    page-attrs
    (remove #(= :block/tags (first %)) page-or-block-attrs))))

(def class-page
  (vec
   (concat
    [:map {:closed false}]
    [[:block/namespace {:optional true} :int]
     ;; TODO: Require :block/schema
     [:block/schema
      {:optional true}
      [:map
       {:closed false}
       [:properties {:optional true} [:vector :uuid]]]]]
    page-attrs
    page-or-block-attrs)))

(def internal-property
  (vec
   (concat
    [:map {:closed false}]
    [[:block/schema
      [:map
       {:closed false}
       [:type (apply vector :enum (into db-property-type/internal-builtin-schema-types
                                        db-property-type/user-builtin-schema-types))]
       [:hide? {:optional true} :boolean]
       [:cardinality {:optional true} [:enum :one :many]]]]]
    page-attrs
    page-or-block-attrs)))

(def user-property
  (vec
   (concat
    [:map {:closed false}]
    [[:block/schema
      [:map
       {:closed false}
       [:type (apply vector :enum db-property-type/user-builtin-schema-types)]
       [:hide? {:optional true} :boolean]
       [:description {:optional true} :string]
       ;; For any types except for :checkbox :default :template :enum
       [:cardinality {:optional true} [:enum :one :many]]
       ;; Just for :enum type
       [:enum-config {:optional true} :map]
       ;; :template uses :sequential and :page uses :set.
       ;; Should :template should use :set?
       [:classes {:optional true} [:or
                                   [:set :uuid]
                                   [:sequential :uuid]]]]]]
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch
           (fn [m] (contains? db-property/built-in-properties-keys-str (:block/name m)))}
   [true internal-property]
   [::m/default user-property]])

(def page
  [:multi {:dispatch :block/type}
   [#{"property"} property-page]
   [#{"class"} class-page]
   [#{"object"} object-page]
   [::m/default normal-page]])

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/content :string]
   [:block/left :int]
   [:block/parent :int]
   [:block/metadata {:optional true}
    [:map {:closed false}
     [:created-from-block :uuid]
     [:created-from-property :uuid]
     [:created-from-template {:optional true} :uuid]]]
    ;; refs
   [:block/page :int]
   [:block/path-refs {:optional true} [:set :int]]
   [:block/link {:optional true} :int]
    ;; other
   [:block/format [:enum :markdown]]
   [:block/marker {:optional true} :string]
   [:block/priority {:optional true} :string]
   [:block/collapsed? {:optional true} :boolean]])

(def object-block
  "A normal block with tags"
  (vec
   (concat
    [:map {:closed false}]
    [[:block/type [:= #{"object"}]]
     [:block/tags [:set :int]]]
    block-attrs
    (remove #(= :block/tags (first %)) page-or-block-attrs))))

(def normal-block
  "A block with content and no special type or tag behavior"
  (vec
   (concat
    [:map {:closed false}]
    block-attrs
    page-or-block-attrs)))

(def block
  "A block has content and a page"
  [:or
   normal-block
   object-block])

;; TODO: Figure out where this is coming from
(def unknown-empty-block
  [:map {:closed true}
   [:block/uuid :uuid]])

(def file-block
  [:map {:closed true}
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:file/content :string]
   [:file/path :string]
   ;; TODO: Remove when bug is fixed
   [:file/last-modified-at {:optional true} :any]])

(def client-db-schema
  [:sequential
   [:or
    page
    block
    file-block
    unknown-empty-block]])

(defn- build-grouped-errors [db full-maps errors]
  (->> errors
       (group-by #(-> % :in first))
       (map (fn [[idx errors']]
              {:entity (cond-> (get full-maps idx)
                         ;; Provide additional page info for debugging
                         (:block/page (get full-maps idx))
                         (update :block/page
                                 (fn [id] (select-keys (d/entity db id)
                                                       [:block/name :block/type :db/id :block/created-at]))))
               ;; Group by type to reduce verbosity
               :errors-by-type
               (->> (group-by :type errors')
                    (map (fn [[type' type-errors]]
                           [type'
                            {:in-value-distinct (->> type-errors
                                                     (map #(select-keys % [:in :value]))
                                                     distinct
                                                     vec)
                             :schema-distinct (->> (map :schema type-errors)
                                                   (map m/form)
                                                   distinct
                                                   vec)}]))
                    (into {}))}))))

(defn- update-schema
  "Updates the db schema to add a datascript db for property validations
   and to optionally close maps"
  [db-schema db {:keys [closed-maps]}]
  (let [db-schema-with-property-vals
        (walk/postwalk (fn [e]
                         (let [meta' (meta e)]
                           (cond
                             (:add-db meta')
                             (partial e db)
                             (:property-value meta')
                             (let [[property-type schema-fn] e
                                   schema-fn' (if (db-property-type/property-types-with-db property-type) (partial schema-fn db) schema-fn)
                                   validation-fn #(validate-property-value property-type schema-fn' %)]
                               [property-type [:tuple :uuid [:fn validation-fn]]])
                             :else
                             e)))
                       db-schema)]
    (if closed-maps
      (walk/postwalk (fn [e]
                       (if (and (vector? e)
                                (= :map (first e))
                                (contains? (second e) :closed))
                         (assoc e 1 (assoc (second e) :closed true))
                         e))
                     db-schema-with-property-vals)
      db-schema-with-property-vals)))

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [db ent-maps* {:keys [verbose group-errors] :as options}]
  (let [ent-maps (vec (map #(if (:block/properties %)
                              (update % :block/properties (fn [x] (mapv identity x)))
                              %)
                           (vals ent-maps*)))
        schema (update-schema client-db-schema db options)]
    (if-let [errors (->> ent-maps
                         (m/explain schema)
                         :errors)]
      (do
        (if group-errors
          (let [ent-errors (build-grouped-errors db ent-maps errors)]
            (println "Found" (count ent-errors) "entities in errors:")
            (if verbose
              (pprint/pprint ent-errors)
              (pprint/pprint (map :entity ent-errors))))
          (do
            (println "Found" (count errors) "errors:")
            (if verbose
              (pprint/pprint
               (map #(assoc %
                            :entity (get ent-maps (-> % :in first))
                            :schema (m/form (:schema %)))
                    errors))
              (pprint/pprint errors))))
        (js/process.exit 1))
      (println "Valid!"))))

(defn- datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (if (contains? db-schema/card-many-attributes (:a m))
                   (update acc (:e m) update (:a m) (fnil conj #{}) (:v m))
                   (update acc (:e m) assoc (:a m) (:v m))))
               {})))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Print more info"}
   :closed-maps {:alias :c
                 :desc "Validate maps marked with closed as :closed"}
   :group-errors {:alias :g
                  :desc "Groups errors by their entity id"}})

(defn- validate-graph [graph-dir options]
  (let [[dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        _ (try (sqlite-db/open-db! dir db-name)
               (catch :default e
                 (println "Error: For graph" (str (pr-str graph-dir) ":") (str e))
                 (js/process.exit 1)))
        conn (sqlite-cli/read-graph db-name)
        datoms (d/datoms @conn :eavt)
        ent-maps (datoms->entity-maps datoms)]
    (println "Read graph" (str db-name " with " (count datoms) " datoms, "
                               (count ent-maps) " entities and "
                               (count (mapcat :block/properties (vals ent-maps))) " properties"))
    (validate-client-db @conn ent-maps options)))

(defn -main [argv]
  (let [{:keys [args opts]} (cli/parse-args argv {:spec spec})
        _ (when (or (empty? args) (:help opts))
            (println (str "Usage: $0 GRAPH-NAME [& ADDITIONAL-GRAPHS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))]
    (doseq [graph-dir args]
      (validate-graph graph-dir opts))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
