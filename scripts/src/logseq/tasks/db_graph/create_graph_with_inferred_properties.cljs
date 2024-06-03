(ns logseq.tasks.db-graph.create-graph-with-inferred-properties
  "Script that generates classes and properties for a demo of inferring properties.
   To try the demo, in any page type:
   - Good Will Hunting #Movie #Ben-Affleck
   or
   - DB 3 #Meeting #Tienson"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [clojure.string :as string]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.core :as nbb]))

(defn- create-init-data []
  (let [[actor-id person-id comment-id attendee-id duration-id] (repeatedly random-uuid)
        person-db-id (create-graph/new-db-id)]
    ;; FIXME: Update to latest format
    {:pages-and-blocks
     [{:page
       {:block/name "person"
        :block/type "class"
        :db/id person-db-id
        :block/uuid person-id}}
      {:page
       {:block/name "movie"
        :block/type "class"
        :block/schema {:properties [actor-id comment-id]}}}
      {:page
       {:block/original-name "Matt-Damon"
        :block/tags [{:db/id person-db-id}]}}
      {:page
       {:block/original-name "Ben-Affleck"
        :block/tags [{:db/id person-db-id}]}}
      {:page
       {:block/name "meeting"
        :block/type "class"
        :block/schema {:properties [attendee-id duration-id]}}}
      {:page
       {:block/original-name "Tienson"
        :block/tags [{:db/id person-db-id}]}}
      {:page
       {:block/original-name "Zhiyuan"
        :block/tags [{:db/id person-db-id}]}}]
     :properties
     {:actor
      {:block/uuid actor-id
       :block/schema {:type :page
                      :classes #{person-id}
                      :cardinality :many}}
      :attendee
      {:block/uuid attendee-id
       :block/schema {:type :page
                      :classes #{person-id}
                      :cardinality :many}}
      :comment {:block/uuid comment-id
                :block/schema {:type :default}}
      :duration {:block/uuid duration-id
                 :block/schema {:type :default}}}}))

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [graph-dir (first args)
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (create-graph/init-conn dir db-name)
        {:keys [init-tx block-props-tx]} (create-graph/build-blocks-tx (create-init-data))]
    (println "Generating" (count (filter :block/name init-tx)) "pages and"
             (count (filter :block/content init-tx)) "blocks ...")
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
