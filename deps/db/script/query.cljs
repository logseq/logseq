(ns query
  "An example script that queries any db graph from the commandline e.g.

  $ yarn -s nbb-logseq script/query.cljs db-name '[:find (pull ?b [:block/name :block/content]) :where [?b :block/created-at]]'"
  (:require [datascript.core :as d]
            [clojure.edn :as edn]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.frontend.rules :as rules]
            [nbb.core :as nbb]
            [clojure.string :as string]
            ["path" :as node-path]
            ["os" :as os]))

(defn- get-dir-and-db-name
  "Gets dir and db name for use with open-db!"
  [graph-dir]
  (if (string/includes? graph-dir "/")
    (let [graph-dir'
          (node-path/join (or js/process.env.ORIGINAL_PWD ".") graph-dir)]
      ((juxt node-path/dirname node-path/basename) graph-dir'))
    [(node-path/join (os/homedir) "logseq" "graphs") graph-dir]))

(defn -main [args]
  (when (< (count args) 2)
    (println "Usage: $0 GRAPH QUERY")
    (js/process.exit 1))
  (let [[graph-dir query*] args
        [dir db-name] (get-dir-and-db-name graph-dir)
        conn (sqlite-db/open-db! dir db-name)
        results (if ((set args) "-e")
                  (map #(when-let [ent (d/entity @conn (edn/read-string %))]
                          (cond-> (into {:db/id (:db/id ent)} ent)
                            (seq (:block/properties ent))
                            (update :block/properties (fn [props] (map (fn [m] (into {} m)) props)))))
                       (drop 2 args))
                  ;; assumes no :in are in queries
                  (let [query (into (edn/read-string query*) [:in '$ '%])
                        res (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules))]
                    ;; Remove nesting for most queries which just have one :find binding
                    (if (= 1 (count (first res))) (mapv first res) res)))]
    (when ((set args) "-v") (println "DB contains" (count (d/datoms @conn :eavt)) "datoms"))
    (prn results)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))