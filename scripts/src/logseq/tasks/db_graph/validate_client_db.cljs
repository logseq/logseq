(ns logseq.tasks.db-graph.validate-client-db
  "Script that validates the datascript db of a db graph.
   Currently only validates :block/schema but it will validate much more ..."
  (:require [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
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
   [:block/refs {:optional true} :any] ;;TODO
   [:block/tags {:optional true} :any] ;;TODO
   [:block/tx-id {:optional true} :int]])

(def page-block
  (into
   [[:block/name :string]
    [:block/original-name :string]
    [:block/type {:optional true} [:enum "property" "class" "object" "whiteboard"]]
    [:block/namespace {:optional true} :int]
    ;; TODO: journal?, journal-day and format optional b/c of property
    [:block/journal? {:optional true} :boolean]
    [:block/journal-day {:optional true} :int]
    [:block/format {:optional true} [:enum :markdown]]
    ;; TODO: Should this be here?
    [:block/path-refs {:optional true} :any]
    ;; TODO: collapsed only for linked
    [:block/collapsed? {:optional true} :boolean]
    ;; TODO: Required for property and class types
    [:block/schema
     {:optional true}
     [:map
      {:closed false}
      ;; TODO: only validate most of these for property blocks
      [:type {:optional true} :keyword]
      [:enum-config {:optional true} :map] ;; TODO
      [:cardinality {:optional true} [:enum :one :many]]
      [:classes {:optional true} [:set :uuid]]
      [:description {:optional true} :string]
      [:hide? {:optional true} :boolean]
      ;; TODO: require this for class blocks
      [:properties {:optional true} [:vector :uuid]]]]]
   page-or-block-attrs))

(def block-attrs
  "Common attributes for normal blocks"
  (into
   [[:block/page :int]
    ;; refs
    ;; TODO: left, parent are only optional b/c of dummy blocks
    [:block/left {:optional true} :int]
    [:block/parent {:optional true} :int]
    [:block/path-refs {:optional true} :any] ;;TODO
    [:block/format {:optional true} [:enum :markdown]]
    ;; other
    [:block/marker {:optional true} :string]
    [:block/priority {:optional true} :string]
    [:block/collapsed? {:optional true} :boolean]]
   page-or-block-attrs))

(def normal-block
  "A normal block is a block with content and a page"
  (into block-attrs
        [[:block/content :string]
         [:block/link {:optional true} :int]]))

;; TODO: Figure out where this is coming from
(def unknown-empty-block
  [[:block/uuid :uuid]])

(def file-block
  [[:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:file/content :string]
   [:file/path :string]
   ;; TODO: Remove when bug is fixed
   [:file/last-modified-at {:optional true} :any]])

(def client-db-schema
  [:sequential
   [:or
    (into [:map {:closed false}] page-block)
    (into [:map {:closed false}] normal-block)
    (into [:map {:closed true}] file-block)
    (into [:map {:closed true}] unknown-empty-block)]])

(defn validate-client-db
  "Validate datascript db as a vec of entity maps"
  [ent-maps {:keys [closed-maps verbose]}]
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
        (println "Found" (count errors) "errors:")
        (if verbose
          (let [full-maps (vec (vals ent-maps))]
            (pprint/pprint
             (map #(assoc %
                          :entity (get full-maps (-> % :in first))
                          :schema (m/form (:schema %)))
                  errors)))
          (pprint/pprint errors))
        (js/process.exit 1))
      (println "Valid!"))))

(defn- datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (update acc (:e m) assoc (:a m) (:v m)))
               {})))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :verbose {:alias :v
             :desc "Print more info"}
   :closed-maps {:alias :c
                 :desc "Validate maps marked with closed as :closed"}})

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
    (validate-client-db ent-maps options)))

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
