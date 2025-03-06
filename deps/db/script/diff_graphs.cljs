(ns diff-graphs
  "A script that diffs two DB graphs through their sqlite.build EDN"
  (:require ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.data :as data]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            #_:clj-kondo/ignore
            [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [nbb.core :as nbb]))

(defn- get-dir-and-db-name
  "Gets dir and db name for use with open-db!"
  [graph-dir]
  (if (string/includes? graph-dir "/")
    (let [graph-dir'
          (node-path/join (or js/process.env.ORIGINAL_PWD ".") graph-dir)]
      ((juxt node-path/dirname node-path/basename) graph-dir'))
    [(node-path/join (os/homedir) "logseq" "graphs") graph-dir]))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :timestamps {:alias :t
                :desc "Include timestamps in export"}})

(defn -main [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        [graph-dir graph-dir2] args'
        _ (when (or (nil? graph-dir) (nil? graph-dir2) (:help options))
            (println (str "Usage: $0 GRAPH-NAME GRAPH-NAME2 [& ARGS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        conn (apply sqlite-cli/open-db! (get-dir-and-db-name graph-dir))
        conn2 (apply sqlite-cli/open-db! (get-dir-and-db-name graph-dir2))
        export-options {:include-timestamps? (:timestamps options)}
        export-map (sqlite-export/build-export @conn {:export-type :graph :graph-options export-options})
        export-map2 (sqlite-export/build-export @conn2 {:export-type :graph :graph-options export-options})
        diff (butlast (data/diff export-map export-map2))]
    (pprint/pprint diff)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
