(ns publishing
  "Basic script for publishing from CLI"
  (:require ["path" :as node-path]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.publishing :as publishing]
            [nbb.core :as nbb]))

(defn- publish-db-graph [static-dir graph-dir output-path opts]
  (let [db-name (node-path/basename graph-dir)
        conn (sqlite-cli/open-db! (node-path/dirname graph-dir) db-name)
        repo-config (-> (d/q '[:find ?content
                               :where [?b :file/path "logseq/config.edn"] [?b :file/content ?content]]
                             @conn)
                        ffirst
                        edn/read-string)]
    (publishing/export @conn
                       static-dir
                       graph-dir
                       output-path
                       (merge opts {:repo (str sqlite-util/db-version-prefix db-name)
                                    :repo-config repo-config
                                    :ui/theme "dark"
                                    :ui/radix-color :cyan}))))

(defn- resolve-path
  "If relative path, resolve with $ORIGINAL_PWD"
  [path]
  (if (node-path/isAbsolute path)
    path
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path)))

(defn -main
  [args]
  (when (< (count args) 3)
    (println "Usage: $0 STATIC-DIR GRAPH-DIR OUT-DIR")
    (js/process.exit 1))
  (let [[static-dir graph-dir output-path] (map resolve-path args)
        options {:dev? (contains? (set args) "--dev")}]
    (publish-db-graph static-dir graph-dir output-path options)))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))