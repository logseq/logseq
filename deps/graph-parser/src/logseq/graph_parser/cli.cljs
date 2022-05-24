(ns logseq.graph-parser.cli
  "Ns only for use by CLIs as it uses node.js libraries"
  (:require ["fs" :as fs]
            [clojure.edn :as edn]
            [logseq.graph-parser :as graph-parser]))

(defn- read-config
  "Commandline version of frontend.handler.common/read-config without graceful
  handling of broken config. Config is assumed to be at $dir/logseq/config.edn "
  [dir]
  (if (fs/existsSync (str dir "/logseq/config.edn"))
    (-> (str dir "/logseq/config.edn") fs/readFileSync str edn/read-string)
    {}))

(defn parse
  "Main entry point for parsing"
  [dir db files]
  (graph-parser/parse db
                      files
                      {:config (read-config dir)}))
