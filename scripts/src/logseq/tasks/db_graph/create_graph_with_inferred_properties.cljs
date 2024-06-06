(ns logseq.tasks.db-graph.create-graph-with-inferred-properties
  "Script that generates classes and properties for a demo of inferring properties.
   To try the demo, in any page type:
   - Good Will Hunting #Movie #Ben-Affleck
   or
   - DB 3 #Meeting #Tienson"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.core :as nbb]))

(defn- create-init-data []
  {:auto-create-ontology? true
   :classes {:Movie {:build/schema-properties [:actor :comment]}
             :Meeting {:build/schema-properties [:attendee :duration]}}
   :properties
   {:actor {:block/schema {:type :object :cardinality :many}
            :build/schema-classes [:Person]}
    :attendee {:block/schema {:type :object :cardinality :many}
               :build/schema-classes [:Person]}}
   :pages-and-blocks
   [{:page {:block/original-name "Matt-Damon" :build/tags [:Person]}}
    {:page {:block/original-name "Ben-Affleck" :build/tags [:Person]}}
    {:page {:block/original-name "Tienson" :build/tags [:Person]}}
    {:page {:block/original-name "Zhiyuan" :build/tags [:Person]}}]})

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [graph-dir (first args)
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (create-graph/init-conn dir db-name)
        {:keys [init-tx block-props-tx]} (sqlite-build/build-blocks-tx (create-init-data))]
    (println "Generating" (count (filter :block/name init-tx)) "pages and"
             (count (filter :block/content init-tx)) "blocks ...")
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
