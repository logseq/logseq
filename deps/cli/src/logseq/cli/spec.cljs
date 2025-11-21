(ns logseq.cli.spec
  "Babashka.cli specs for commands. Normally these would live alongside their
  commands but are separate because command namespaces are lazy loaded")

(def export
  {:graph {:alias :g
           :desc "Local graph to export"}
   :file {:alias :f
          :desc "File to save export"}})

(def export-edn
  {:api-server-token {:alias :a
                      :desc "API server token to export current graph"}
   :graph {:alias :g
           :desc "Local graph to export"}
   :include-timestamps? {:alias :T
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

(def import-edn
  {:api-server-token {:alias :a
                      :desc "API server token to import into current graph"}
   :graph {:alias :g
           :desc "Local graph to import into"}
   :file {:alias :f
          :require true
          :desc "EDN File to import"}})

(def query
  {:api-server-token {:alias :a
                      :desc "API server token to query current graph"}
   :graphs {:alias :g
            :coerce []
            :desc "Local graph(s) to query"}
   :properties-readable {:alias :p
                         :coerce :boolean
                         :desc "Make properties on local, entity queries show property values instead of ids"}
   :title-query {:alias :t
                 :desc "Invoke local query on :block/title"}})

(def search
  {:api-server-token {:alias :a
                      :desc "API server token to search current graph"}
   :graph {:alias :g
           :desc "Local graph to search"}
   :raw {:alias :r
         :desc "Print raw response"}
   :limit {:alias :l
           :default 100
           :desc "Limit max number of results"}})

(def append
  {:api-server-token {:alias :a
                      :desc "API server token to modify current graph"}})

(def mcp-server
  {:api-server-token {:alias :a
                      :desc "API server token to connect to current graph"}
   :graph {:alias :g
           :desc "Local graph to use with MCP server"}
   :stdio {:alias :s
           :desc "Run the MCP server via stdio transport"}
   :port {:alias :p
          :default 12315
          :coerce :long
          :desc "Port for streamable HTTP server"}
   :host {:default "127.0.0.1"
          :desc "Host for streamable HTTP server"}
   :debug-tool {:alias :t
                :coerce :keyword
                :desc "Debug mcp tool with direct invocation"}})

(def validate
  {:graphs {:alias :g
            :coerce []
            :require true
            :desc "Local graph(s) to validate"}
   :closed {:alias :c
            :default true
            :desc "Validate entities have no extra keys"}})