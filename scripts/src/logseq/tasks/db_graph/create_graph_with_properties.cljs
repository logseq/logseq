(ns logseq.tasks.db-graph.create-graph-with-properties
  "Script that generates all the permutations of property types and cardinality.
   Also creates a page of queries that exercises most properties
   NOTE: This script is also used in CI to confirm graph creation works"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.core :as nbb]))

(defn- date-journal-title [date]
  (let [title (.toLocaleString date "en-US" #js {:month "short" :day "numeric" :year "numeric"})
        suffixes {1 "st" 21 "st" 31 "st" 2 "nd" 22 "nd" 3 "rd" 23 "rd" 33 "rd"}]
    (sqlite-util/sanitize-page-name
     (string/replace-first title #"(\d+)" (str "$1" (suffixes (.getDate date) "th"))))))

(defn- date-journal-day [date]
  (js/parseInt (str (.toLocaleString date "en-US" #js {:year "numeric"})
                    (.toLocaleString date "en-US" #js {:month "2-digit"})
                    (.toLocaleString date "en-US" #js {:day "2-digit"}))))

(defn- subtract-days
  [date days]
  (new js/Date (- (.getTime date) (* days 24 60 60 1000))))

(defn- build-closed-values-config
  [{:keys [dates]}]
  {:default-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid)
                    :icon {:id % :name % :type :emoji})
         ["joy" "sob" "upside_down_face"])
   :url-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid))
         ["https://logseq.com" "https://docs.logseq.com" "https://github.com/logseq/logseq"])
   :number-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid))
         [10 42 (rand 100)])
   :page-closed
   (mapv #(hash-map :value [:page %])
         ["page 1" "page 2" "page 3"])
   :date-closed
   (mapv #(hash-map :value [:page (date-journal-title %)])
         dates)})

(defn- create-init-data
  []
  (let [today (new js/Date)
        yesterday (subtract-days today 1)
        two-days-ago (subtract-days today 2)
        closed-values-config (build-closed-values-config {:dates [today yesterday two-days-ago]})
        random-closed-value #(-> closed-values-config % rand-nth :uuid)
        random-page-closed-value #(-> closed-values-config % rand-nth :value)]
    {:pages-and-blocks
     [{:page
       {:block/name (date-journal-title today) :block/journal? true :block/journal-day (date-journal-day today)}
       :blocks
       [{:block/content "[[Properties]]"}
        {:block/content "[[Queries]]"}]}
      {:page
       {:block/name (date-journal-title yesterday) :block/journal? true :block/journal-day (date-journal-day yesterday)}}
      {:page
       {:block/name (date-journal-title two-days-ago) :block/journal? true :block/journal-day (date-journal-day two-days-ago)}}
      {:page {:block/name "properties"}
       :blocks
       [{:block/content "default property block" :properties {:default "haha"}}
        {:block/content "default-closed property block" :properties {:default-closed (random-closed-value :default-closed)}}
        {:block/content "url property block" :properties {:url "https://logseq.com"}}
        {:block/content "url-many property block" :properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}
        {:block/content "url-closed property block" :properties {:url-closed (random-closed-value :url-closed)}}
        {:block/content "checkbox property block" :properties {:checkbox true}}
        {:block/content "number property block" :properties {:number 5}}
        {:block/content "number-many property block" :properties {:number-many #{5 10}}}
        {:block/content "number-closed property block" :properties {:number-closed (random-closed-value :number-closed)}}
        {:block/content "page property block" :properties {:page [:page "page 1"]}}
        {:block/content "page-many property block" :properties {:page-many #{[:page "page 1"] [:page "page 2"]}}}
        {:block/content "page-closed property block" :properties {:page-closed (random-page-closed-value :page-closed)}}
        {:block/content "date property block" :properties {:date [:page (date-journal-title today)]}}
        {:block/content "date-many property block" :properties {:date-many #{[:page (date-journal-title today)]
                                                                             [:page (date-journal-title yesterday)]}}}
        {:block/content "date-closed property block" :properties {:date-closed (random-page-closed-value :date-closed)}}]}
      {:page {:block/name "queries"}
       :blocks
       [{:block/content "{{query (property :default \"haha\")}}"}
        {:block/content "{{query (property :url \"https://logseq.com\")}}"}
        {:block/content "{{query (property :url-many \"https://logseq.com\")}}"}
        {:block/content "{{query (property :checkbox true)}}"}
        {:block/content "{{query (property :number 5)}}"}
        {:block/content "{{query (property :number-many 10)}}"}
        {:block/content "{{query (property :page [[Page 1]])}}"}
        {:block/content "{{query (property :page-many [[Page 2]])}}"}
        {:block/content (str "{{query (property :date [[" (string/capitalize (date-journal-title today)) "]])}}")}
        {:block/content (str "{{query (property :date-many [[" (string/capitalize (date-journal-title yesterday)) "]])}}")}]}
      {:page {:block/name "page 1"}
       :blocks
       [{:block/content "yee"}
        {:block/content "haw"}]}
      {:page {:block/name "page 2"}}
      {:page {:block/name "page 3"}}]
     :properties
     (->> [:default :url :checkbox :number :page :date]
          (mapcat #(cond-> [[% {:block/schema {:type %}}]]
                     (db-property-type/property-type-allows-schema-attribute? % :cardinality)
                     (conj [(keyword (str (name %) "-many")) {:block/schema {:type % :cardinality :many}}])))
          (into (mapv #(vector (keyword (str (name %) "-closed"))
                               {:closed-values (closed-values-config (keyword (str (name %) "-closed")))
                                :block/schema {:type %}})
                      [:default :url :number :page :date]))
          (into {}))}))

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [graph-dir (first args)
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (create-graph/init-conn dir db-name)
        blocks-tx (create-graph/create-blocks-tx
                   (create-init-data)
                   {:property-uuids {:icon (:block/uuid (d/entity @conn [:block/name "icon"]))}})]
    (println "Generating" (count (filter :block/name blocks-tx)) "pages and"
             (count (filter :block/content blocks-tx)) "blocks ...")
    (d/transact! conn blocks-tx)
    (println "Created graph" (str db-name " with " (count (d/datoms @conn :eavt)) " datoms!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))