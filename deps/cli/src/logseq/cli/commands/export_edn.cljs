(ns logseq.cli.commands.export-edn
  "Export edn command"
  (:require ["fs" :as fs]
            [clojure.pprint :as pprint]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.cli.util :as cli-util]))

(def spec
  "Options spec"
  {:include-timestamps? {:alias :T
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

(defn export [{{:keys [graph] :as options} :opts}]
  (if (fs/existsSync (cli-util/get-graph-dir graph))
   (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
         export-map (sqlite-export/build-export @conn
                                                (cond-> {:export-type (:export-type options)}
                                                  (= :graph (:export-type options))
                                                  (assoc :graph-options (dissoc options :file :export-type :graph))))]
     (if (:file options)
       (do
         (println "Exported" (count (:properties export-map)) "properties,"
                  (count (:properties export-map)) "classes and"
                  (count (:pages-and-blocks export-map)) "pages")
         (fs/writeFileSync (:file options)
                           (with-out-str (pprint/pprint export-map))))
       (pprint/pprint export-map)))
    (println "Graph" (pr-str graph) "does not exist")))