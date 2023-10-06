(ns logseq.tasks.db-graph.validate-client-db
  "Script that validates the datascript db of a db graph"
  (:require [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.schema :as db-schema]
            [logseq.db.property :as db-property]
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

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/properties {:optional true}
    [:map-of :uuid [:or
                    :string
                    :int
                    :boolean
                    :uuid
                    :map
                    [:vector [:or :keyword :uuid]]
                    [:set :uuid]
                     ;; TODO: Remove when bug is fixed
                    [:sequential :uuid]
                    [:set :string]
                    [:set :int]]]]
   [:block/refs {:optional true} [:set :int]]
   [:block/tags {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/original-name :string]
   [:block/type {:optional true} [:enum #{"property"} #{"class"} #{"object"} #{"whiteboard"}]]
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
    [[:block/collapsed? {:optional true} :boolean]]
    page-attrs
    page-or-block-attrs)))

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
       [:type (apply vector :enum (into db-property/internal-builtin-schema-types
                                        db-property/user-builtin-schema-types))]
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
       [:type (apply vector :enum db-property/user-builtin-schema-types)]
       [:hide? {:optional true} :boolean]
       [:description {:optional true} :string]
       ;; For any types except for :checkbox :default :template :enum
       [:cardinality {:optional true} [:enum :one :many]]
       ;; Just for :enum type
       [:enum-config {:optional true} :map]
       ;; Just for :page and :template types
       [:classes {:optional true} [:set :uuid]]]]]
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch
           (fn [m] (contains? db-property/built-in-properties-keys-str (:block/name m)))}
   [true internal-property]
   [::m/default user-property]])

(def page-block
  [:multi {:dispatch :block/type}
   [#{"property"} property-page]
   [#{"class"} class-page]
   [#{"object"} object-page]
   [::m/default normal-page]])

(def block-attrs
  "Common attributes for normal blocks"
  (into
   ;; refs
   [[:block/page :int]
    [:block/path-refs {:optional true} [:set :int]]
    [:block/link {:optional true} :int]
    ;; other
    [:block/format [:enum :markdown]]
    [:block/marker {:optional true} :string]
    [:block/priority {:optional true} :string]
    [:block/collapsed? {:optional true} :boolean]]
   page-or-block-attrs))

(def normal-block
  "A normal block is a block with content and a page"
  (vec
   (concat
    [:map {:closed false}]
    block-attrs
    [[:block/content :string]
     [:block/left :int]
     [:block/parent :int]
     [:block/metadata {:optional true}
      [:map {:closed false}
       [:created-from-block :uuid]
       [:created-from-property :uuid]]]])))

(def normal-empty-block
  "This empty block is created when a default property value has multiple
  blocks. This block doesn't have :block/left or :block/parent attributes.
  Unclear if this is intentional"
  (vec
   (concat
    [:map {:closed false}]
    block-attrs
    [[:block/content [:= ""]]
     [:block/metadata
      [:map {:closed false}
       [:created-from-block :uuid]
       [:created-from-property :uuid]]]])))

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
    page-block
    normal-block
    normal-empty-block
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

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [db ent-maps {:keys [closed-maps verbose group-errors]}]
  (let [schema (if closed-maps
                 (walk/postwalk (fn [e]
                                  (if (and (vector? e)
                                           (= :map (first e))
                                           (contains? (second e) :closed))
                                    (assoc e 1 (assoc (second e) :closed true))
                                    e))
                                client-db-schema)
                 client-db-schema)]
    (if-let [errors (->> ent-maps
                         vals
                         (m/explain schema)
                         :errors)]
      (do
        (if group-errors
          (let [ent-errors (build-grouped-errors db (vec (vals ent-maps)) errors)]
            (println "Found" (count ent-errors) "entities in errors:")
            (if verbose
              (pprint/pprint ent-errors)
              (pprint/pprint (map :entity ent-errors))))
          (do
            (println "Found" (count errors) "errors:")
            (if verbose
              (let [full-maps (vec (vals ent-maps))]
                (pprint/pprint
                 (map #(assoc %
                              :entity (get full-maps (-> % :in first))
                              :schema (m/form (:schema %)))
                      errors)))
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
    (println "Read graph" (str db-name " with " (count datoms) " datoms!"))
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
