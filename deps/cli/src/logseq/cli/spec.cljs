(ns logseq.cli.spec
  "Specs for commands. Normally these would live alongside their commands but are separate
   because command namespaces are lazy loaded")

(def export-edn
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

(def query
  {:graphs {:alias :g
            :coerce []
            :desc "Additional graphs to query"}
   :api-query-token {:alias :a
                     :desc "Query current graph with api server token"}})

(def search
  {:api-query-token {:alias :a
                     :require true
                     :desc "Api server token"}
   :raw {:alias :r
         :desc "Print raw response"}
   :limit {:alias :l
           :default 100
           :desc "Limit max number of results"}})