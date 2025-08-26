(ns logseq.cli.spec
  "Babashka.cli specs for commands. Normally these would live alongside their
  commands but are separate because command namespaces are lazy loaded")

(def export
  {:file {:alias :f
          :desc "File to save export"}})

(def export-edn
  {:include-timestamps? {:alias :T
                         :desc "Include timestamps in export"}
   :file {:alias :f
          :desc "File to save export"}
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
            :desc "Additional graphs to local query"}
   :properties-readable {:alias :p
                         :coerce :boolean
                         :desc "Make properties on local, entity queries show property values instead of ids"}
   :title-query {:alias :t
                 :desc "Invoke local query on :block/title"}
   :api-server-token {:alias :a
                      :desc "API server token to query current graph"}})

(def search
  {:api-server-token {:alias :a
                      :desc "API server token to search current graph"}
   :raw {:alias :r
         :desc "Print raw response"}
   :limit {:alias :l
           :default 100
           :desc "Limit max number of results"}})

(def append
  {:api-server-token {:alias :a
                      :desc "API server token to modify current graph"}})