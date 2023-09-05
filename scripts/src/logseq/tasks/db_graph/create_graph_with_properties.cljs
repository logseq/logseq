(ns logseq.tasks.db-graph.create-graph-with-properties
  "Script that generates all the permutations of property types and cardinality.
   Also creates a page of queries that exercises most properties"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.core :as nbb]))

(defn- date-journal-title [date]
  (let [title (.toLocaleString date "en-US" #js {:month "short" :day "numeric" :year "numeric"})
        suffixes {1 "st" 21 "st" 31 "st" 2 "nd" 22 "nd" 3 "rd" 23 "rd" 33 "rd"}]
    (string/lower-case
     (string/replace-first title #"(\d+)" (str "$1" (suffixes (.getDate date) "th"))))))

(defn- date-journal-day [date]
  (js/parseInt (str (.toLocaleString date "en-US" #js {:year "numeric"})
                    (.toLocaleString date "en-US" #js {:month "2-digit"})
                    (.toLocaleString date "en-US" #js {:day "2-digit"}))))

(defn- create-init-data
  []
  {:pages-and-blocks
   [{:page
     (let [today (new js/Date)]
       {:block/name (date-journal-title today) :block/journal? true :block/journal-day (date-journal-day today)})
     :blocks
     [{:block/content "[[Properties]]"}
      {:block/content "[[Queries]]"}]}
    {:page {:block/name "properties"}
     :blocks
     [{:block/content "default property block" :properties {:default "haha"}}
      {:block/content "url property block" :properties {:url "https://logseq.com"}}
      {:block/content "default-many property block" :properties {:default-many #{"woo" "hoo"}}}
      {:block/content "url-many property block" :properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}
      {:block/content "checkbox property block" :properties {:checkbox true}}
      {:block/content "number property block" :properties {:number 5}}
      {:block/content "number-many property block" :properties {:number-many #{5 10}}}
      {:block/content "page property block" :properties {:page [:page "page 1"]}}
      {:block/content "page-many property block" :properties {:page-many #{[:page "page 1"] [:page "page 2"]}}}
      ;; TODO: Update block examples
      #_{:block/content "block property block" :properties {:block [:block "yee"]}}
      #_{:block/content "block-many property block" :properties {:block-many #{[:block "yee"] [:block "haw"]}}}]}
    {:page {:block/name "queries"}
     :blocks
     [{:block/content "{{query (property :default \"haha\")}}"}
      {:block/content "{{query (property :url \"https://logseq.com\")}}"}
      {:block/content "{{query (property :default-many \"woo\")}}"}
      {:block/content "{{query (property :url-many \"https://logseq.com\")}}"}
      {:block/content "{{query (property :checkbox true)}}"}
      {:block/content "{{query (property :number 5)}}"}
      {:block/content "{{query (property :number-many 10)}}"}
      {:block/content "{{query (property :page \"Page 1\")}}"}
      {:block/content "{{query (property :page-many \"Page 2\")}}"}]}
    {:page {:block/name "page 1"}
     :blocks
     [{:block/content "yee"}
      {:block/content "haw"}]}
    {:page {:block/name "page 2"}}]
   :properties
   (->> [:default :url :checkbox :number :page :block]
        (mapcat #(cond-> [[% {:block/schema {:type %}}]]
                   (not= % :checkbox)
                   (conj [(keyword (str (name %) "-many")) {:block/schema {:type % :cardinality :many}}])))
        (into {}))})

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [graph-dir (first args)
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (create-graph/init-conn dir db-name)
        blocks-tx (create-graph/create-blocks-tx (create-init-data))]
    (println "Generating" (count (filter :block/name blocks-tx)) "pages and"
             (count (filter :block/content blocks-tx)) "blocks ...")
    (d/transact! conn blocks-tx)
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))