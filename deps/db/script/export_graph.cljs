(ns export-graph
  "A script that exports a graph to a sqlite.build EDN file"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.pprint :as pprint]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [nbb.core :as nbb]))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :include-timestamps? {:alias :T
                         :desc "Include timestamps in export"}
   :file {:alias :f
          :desc "Saves edn to file"}
   :catch-validation-errors? {:alias :c
                              :desc "Catch validation errors for dev"}
   :exclude-namespaces {:alias :e
                        :coerce #{}
                        :desc "Namespaces to exclude from properties and classes"}
   :exclude-built-in-pages? {:alias :b
                             :desc "Exclude built-in pages"}
   :exclude-files? {:alias :F
                    :desc "Exclude :file/path files"}
   :export-type {:alias :t
                 :coerce :keyword
                 :desc "Export type"
                 :default :graph}})

(defn -main [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        graph-dir (first args')
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [& ARGS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        conn (apply sqlite-cli/open-db! (sqlite-cli/->open-db-args graph-dir))
        export-map (sqlite-export/build-export @conn
                                               (cond-> {:export-type (:export-type options)}
                                                 (= :graph (:export-type options))
                                                 (assoc :graph-options (dissoc options :file :export-type))))]
    (if (:file options)
      (do
        (println "Exported" (count (:properties export-map)) "properties,"
                 (count (:properties export-map)) "classes and"
                 (count (:pages-and-blocks export-map)) "pages")
        (fs/writeFileSync (resolve-path (:file options))
                          (with-out-str (pprint/pprint export-map))))
      (pprint/pprint export-map))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
