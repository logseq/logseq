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

(def client-db-schema
  [:sequential
   [:map
    {:closed false}
    [:block/uuid :uuid]
    [:block/name {:optional true} :string]
    [:block/original-name {:optional true} :string]
    [:block/type {:optional true} [:enum "property" "class" "object" "whiteboard"]]
    [:block/content {:optional true} :string]
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
    [:block/created-at {:optional true} :int]
    [:block/updated-at {:optional true} :int]
    ;; refs
    [:block/left {:optional true} :int]
    [:block/parent {:optional true} :int]
    [:block/page {:optional true} :int]
    [:block/namespace {:optional true} :int]
    [:block/link {:optional true} :int]
    [:block/path-refs {:optional true} :any] ;;TODO
    [:block/refs {:optional true} :any] ;;TODO
    [:block/tags {:optional true} :any] ;;TODO
    ;; other
    [:block/collapsed? {:optional true} :boolean]
    [:block/journal? {:optional true} :boolean]
    [:block/journal-day {:optional true} :int]
    [:block/format {:optional true} [:enum :markdown]]
    [:block/tx-id {:optional true} :int]
    [:block/marker {:optional true} :string]
    [:block/schema
     {:optional true}
     [:map
      {:closed false}
      ;; TODO: only validate most of these for property blocks
      [:type {:optional true} :keyword]
      [:cardinality {:optional true} [:enum :one :many]]
      [:classes {:optional true} [:set :uuid]]
      [:description {:optional true} :string]
      [:hide? {:optional true} :boolean]
      ;; TODO: require this for class blocks
      [:properties {:optional true} [:vector :uuid]]]]

    [:file/content {:optional true} :string]
    ;; TODO: Remove when bug is fixed
    [:file/last-modified-at {:optional true} :any]
    [:file/path {:optional true} :string]]])

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
                         :entity (get full-maps (-> % :in first)))
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

(defn -main [args]
  (let [graph-dir (first args)
        options (cli/parse-opts args {:spec spec})
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        _ (sqlite-db/open-db! dir db-name)
        conn (sqlite-cli/read-graph db-name)
        datoms (d/datoms @conn :eavt)
        ent-maps (datoms->entity-maps datoms)]
    (println "Read graph" (str db-name " with " (count datoms) " datoms!"))
    (validate-client-db ent-maps options)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
