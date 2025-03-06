(ns export-graph
  "A script that exports a graph to a sqlite.build EDN file"
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.edn :as edn]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            #_:clj-kondo/ignore
            [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [nbb.core :as nbb]))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

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
                :desc "Include timestamps in export"}
   :file {:alias :f
          :desc "Saves edn to file"}
   :export-options {:alias :e
                    :desc "Raw options map to pass to export"}})

(defn -main [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        graph-dir (first args')
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [& ARGS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        [dir db-name] (get-dir-and-db-name graph-dir)
        conn (sqlite-cli/open-db! dir db-name)
        export-options (merge {:include-timestamps? (:timestamps options)}
                              (edn/read-string (:export-options options)))
        export-map (sqlite-export/build-export @conn {:export-type :graph :graph-options export-options})]
    (when (:file options)
      (fs/writeFileSync (resolve-path (:file options))
                        (with-out-str (pprint/pprint export-map))))
    (pprint/pprint export-map)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
