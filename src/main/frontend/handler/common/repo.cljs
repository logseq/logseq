(ns ^:nbb-compatible frontend.handler.common.repo
  (:require [datascript.core :as d]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util :as gp-util]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn build-db-initial-data
  [config-content]
  (let [initial-files [{:block/uuid (d/squuid)
                        :file/path (str "logseq/" "config.edn")
                        :file/content config-content}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.css")
                        :file/content ""}
                       {:block/uuid (d/squuid)
                        :file/path (str "logseq/" "custom.js")
                        :file/content ""}]
        default-properties (map
                            (fn [[k-keyword {:keys [schema original-name]}]]
                              (let [k-name (name k-keyword)]
                                (sqlite-util/block-with-timestamps
                                 {:block/schema schema
                                  :block/original-name (or original-name k-name)
                                  :block/name (gp-util/page-name-sanity-lc k-name)
                                  :block/uuid (d/squuid)
                                  :block/type "property"})))
                            gp-property/db-built-in-properties)]
    (concat initial-files default-properties)))